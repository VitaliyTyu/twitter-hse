/* eslint-disable @typescript-eslint/no-unsafe-member-access */
/* eslint-disable @typescript-eslint/no-unsafe-call */
/* eslint-disable @typescript-eslint/no-unsafe-assignment */
import { z } from "zod";
import { publicProcedure, createTRPCRouter, privateProcedure } from "../trpc";
import type { Post } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";
import { TRPCError } from "@trpc/server";
import { mapUserForClient } from "~/server/helpers/mapUserForClient";
import { Ratelimit } from "@upstash/ratelimit"; // for deno: see above
import { Redis } from "@upstash/redis";
import { type PrismaClient } from '@prisma/client';

interface IComment {
    id: string;
    authorId: string;
    content: string;
    createdAt: Date;
}

interface IPost extends Post {
    comments: IComment[];
}

const addDataToPosts = async (posts: IPost[], prisma: PrismaClient) => {
    // Сбор всех userIds из постов и комментариев
    const postAuthorIds = posts.map((post) => post.authorId);
    const postIds = posts.map((post) => post.id);

    // Получение всех комментариев для постов
    const comments = await prisma.comment.findMany({
        where: {
            postId: { in: postIds },
        },
    });

    // Извлечение уникальных userIds из комментариев
    const commentAuthorIds = comments.map((comment) => comment.authorId);
    const allUserIds = Array.from(new Set([...postAuthorIds, ...commentAuthorIds]));

    // Получение данных пользователей
    const users = (
        await clerkClient.users.getUserList({
            userId: allUserIds,
            limit: 110,
        })
    ).map(mapUserForClient);

    // Функция для добавления данных пользователей к комментариям
    const addUserDataToComments = (comments: IComment[]) => {
        if (comments.length === 0) return [];

        const newComments = comments.map((comment) => {
            const authorData = users.find((user) => user.id === comment.authorId);

            return {
                ...comment,
                author: authorData,
            };
        });

        return newComments;
    };

    // Получение реакций для всех постов
    const reactions = await prisma.reaction.findMany({
        where: {
            postId: { in: postIds },
        },
    });

    // Создание постов с дополнительными данными
    const postsWithAdditionalData = posts.map((post) => {
        const author = users.find((user) => user.id === post.authorId);

        if (!author) {
            throw new TRPCError({
                code: "INTERNAL_SERVER_ERROR",
                message: `Author for post not found. POST ID: ${post.id}, USER ID: ${post.authorId}`,
            });
        }

        if (!author.username) {
            if (!author.externalUsername) {
                throw new TRPCError({
                    code: "INTERNAL_SERVER_ERROR",
                    message: `Author has no GitHub Account: ${author.id}`,
                });
            }

            author.username = author.externalUsername;
        }

        // Фильтрация реакций для текущего поста
        const postReactions = reactions.filter((reaction) => reaction.postId === post.id);
        const postComments = comments.filter((comment) => comment.postId === post.id);
        const newComments = addUserDataToComments(postComments);

        return {
            post,
            comments: newComments,
            author: {
                ...author,
                username: author.username ?? "(username not found)",
            },
            reactions: postReactions,
        };
    });

    return postsWithAdditionalData;
};

// Create a new ratelimiter, that allows 3 requests per 1 minute
const ratelimit = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(15, "1 m"),
    analytics: true,
});

export const postsRouter = createTRPCRouter({
    getById: publicProcedure
        .input(z.object({ id: z.string() }))
        .query(async ({ ctx, input }) => {
            const post = await ctx.prisma.post.findUnique({
                where: { id: input.id },
                include: {
                    comments: true,
                },
            });

            if (!post) throw new TRPCError({ code: "NOT_FOUND" });

            return (await addDataToPosts([post], ctx.prisma))[0];
        }),

    getAll: publicProcedure
        .input(z.object({ skip: z.number().optional(), take: z.number().optional() }))
        .query(async ({ ctx, input }) => {
            const posts = await ctx.prisma.post.findMany({
                take: input.take ?? undefined,
                skip: input.skip ?? undefined,
                orderBy: [{ createdAt: "desc" }],
                include: {
                    comments: true,
                },
            });

            console.log("posts", posts);

            return addDataToPosts(posts, ctx.prisma);
        }),

    getPostsByUserId: publicProcedure
        .input(
            z.object({
                userId: z.string(),
                skip: z.number().optional(),
                take: z.number().optional()
            }),
        )
        .query(({ ctx, input }) =>
            ctx.prisma.post
                .findMany({
                    where: {
                        authorId: input.userId,
                    },
                    take: input.take ?? undefined,
                    skip: input.skip ?? undefined,
                    orderBy: [{ createdAt: "desc" }],
                    include: {
                        comments: true,
                    },
                })
                .then((posts) => addDataToPosts(posts, ctx.prisma)),
        ),

    create: privateProcedure
        .input(
            z.object({
                content: z
                    .string()
                    .min(1)
                    .max(1024, "Length should be less than 1024 symbols"),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const authorId = ctx.userId;

            const { success } = await ratelimit.limit(authorId);
            if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

            const post = await ctx.prisma.post.create({
                data: {
                    content: input.content,
                    authorId,
                },
            });

            return post;
        }),
    deletePost: privateProcedure
        .input(z.object({ id: z.string() }))
        .mutation(async ({ ctx, input }) => {
            const post = await ctx.prisma.post.findUnique({
                where: { id: input.id },
            });

            if (!post) {
                throw new TRPCError({ code: "NOT_FOUND", message: "Post not found" });
            }

            if (post.authorId !== ctx.userId) {
                throw new TRPCError({ code: "FORBIDDEN", message: "You are not allowed to delete this post" });
            }

            await ctx.prisma.post.delete({
                where: { id: input.id },
            });

            return { message: "Post deleted successfully" };
        }),
    addComment: privateProcedure
        .input(
            z.object({
                postId: z.string(),
                content: z.string().min(1).max(1024),
            }),
        )
        .mutation(async ({ ctx, input }) => {
            const authorId = ctx.userId;

            const post = await ctx.prisma.post.findUnique({
                where: { id: input.postId },
                include: { comments: true }, // Включаем комментарии поста
            });

            if (!post) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Post not found",
                });
            }

            const comment = await ctx.prisma.comment.create({
                data: {
                    content: input.content,
                    postId: input.postId,
                    authorId,
                },
            });

            return comment;
        }),
});

export const reactionsRouter = createTRPCRouter({
    addReaction: privateProcedure
        .input(
            z.object({
                postId: z.string(),
                type: z.string().max(20),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;

            const { success } = await ratelimit.limit(userId);
            if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

            // One user can set only one reaction
            const existingReaction = await ctx.prisma.reaction.findFirst({
                where: {
                    userId,
                    postId: input.postId,
                    type: input.type,
                },
            });

            if (existingReaction) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "You already has the reaction on this post",
                });
            }

            const reaction = await ctx.prisma.reaction.create({
                data: {
                    userId,
                    postId: input.postId,
                    type: input.type,
                },
            });

            return reaction;
        }),

    removeReaction: privateProcedure
        .input(
            z.object({
                postId: z.string(),
                type: z.string().max(20),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const userId = ctx.userId;

            const { success } = await ratelimit.limit(userId);
            if (!success) throw new TRPCError({ code: "TOO_MANY_REQUESTS" });

            // Find existing reaction to remove it
            const existingReaction = await ctx.prisma.reaction.findFirst({
                where: {
                    userId,
                    postId: input.postId,
                    type: input.type,
                },
            });

            if (!existingReaction) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "Reaction not found",
                });
            }

            await ctx.prisma.reaction.delete({
                where: {
                    id: existingReaction.id,
                },
            });

            return { message: "Reaction deleted successfully" };
        }),


});

