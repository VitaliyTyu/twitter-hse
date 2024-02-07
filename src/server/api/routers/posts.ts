import { z } from "zod";
import { publicProcedure, createTRPCRouter, privateProcedure } from "../trpc";
import type { Post } from "@prisma/client";
import { clerkClient } from "@clerk/nextjs";
import type { User } from "@clerk/nextjs/server";
import { TRPCError } from "@trpc/server";

const mapUserForClient = (user: User) => {
  return {
    id: user.id,
    username: user.username,
    imageUrl: user.imageUrl,
    externalUsername:
      user.externalAccounts.find(
        (externalAccount) => externalAccount.provider === "oauth_github",
      )?.username ?? null,
  };
};

const addUserDataToPosts = async (posts: Post[]) => {
  const userIds = posts.map((post) => post.authorId);

  const users = (
    await clerkClient.users.getUserList({
      userId: userIds,
      limit: 110,
    })
  ).map(mapUserForClient);

  const postsWithAuthor = posts.map((post) => {
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

    return {
      post,
      author: {
        ...author,
        username: author.username ?? "(username not found)",
      },
    };
  });

  return postsWithAuthor;
};

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });

    console.log("posts", posts);

    return addUserDataToPosts(posts);
  }),

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

      const post = await ctx.prisma.post.create({
        data: {
          content: input.content,
          authorId,
        },
      });

      return post;
    }),
});
