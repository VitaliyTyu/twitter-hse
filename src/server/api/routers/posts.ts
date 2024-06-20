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

const addDataToPosts = async (posts: Post[], prisma: PrismaClient) => {
  const userIds = posts.map((post) => post.authorId);
  const postIds = posts.map((post) => post.id);

  const users = (
    await clerkClient.users.getUserList({
      userId: userIds,
      limit: 110,
    })
  ).map(mapUserForClient);

  // Fetch reactions for all posts
  const reactions = await prisma.reaction.findMany({
    where: {
      postId: { in: postIds },
    },
  });

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

    // Filter reactions for the current post
    const postReactions = reactions.filter((reaction) => reaction.postId === post.id);

    return {
      post,
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
      });

      if (!post) throw new TRPCError({ code: "NOT_FOUND" });

      return (await addDataToPosts([post], ctx.prisma))[0];
    }),

  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    console.log("posts", posts);

    return addDataToPosts(posts, ctx.prisma);
  }),

  getPostsByUserId: publicProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .query(({ ctx, input }) =>
      ctx.prisma.post
        .findMany({
          where: {
            authorId: input.userId,
          },
          take: 100,
          orderBy: [{ createdAt: "desc" }],
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
          message: "Вы уже оставили такую реакцию на этот пост.",
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
          message: "Реакция не найдена.",
        });
      }

      await ctx.prisma.reaction.delete({
        where: {
          id: existingReaction.id,
        },
      });

      return { message: "Реакция успешно удалена." };
    }),
});

