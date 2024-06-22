import { z } from "zod";
import { createTRPCRouter, privateProcedure, publicProcedure } from "../trpc";
import { clerkClient } from "@clerk/nextjs";
import { mapUserForClient } from "~/server/helpers/mapUserForClient";
import { TRPCError } from "@trpc/server";

export const profileRouter = createTRPCRouter({
  getUserByUsername: publicProcedure
    .input(z.object({ username: z.string() }))
    .query(async ({ input }) => {
      const [user] = await clerkClient.users.getUserList({
        userId: [input.username],
      });

      if (!user) {
        // if we hit here we need a unsantized username so hit api once more and find the user.
        const users = await clerkClient.users.getUserList({
          limit: 200,
        });

        const user = users.find((user) =>
          user.externalAccounts.find(
            (account) => account.username === input.username,
          ),
        );

        if (!user) {
          throw new TRPCError({
            code: "INTERNAL_SERVER_ERROR",
            message: "User not found",
          });
        }

        return mapUserForClient(user);
      }

      return mapUserForClient(user);
    }),
});

export const followRouter = createTRPCRouter({
    followUser: privateProcedure
        .input(
            z.object({
                followingId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const followerId = ctx.userId;
  
            // Check if the user is already following the other user
            const existingFollow = await ctx.prisma.follow.findFirst({
                where: {
                    followerId,
                    followingId: input.followingId,
                },
            });
  
            if (existingFollow) {
                throw new TRPCError({
                    code: "CONFLICT",
                    message: "You are already following this user",
                });
            }
  
            const follow = await ctx.prisma.follow.create({
                data: {
                    followerId,
                    followingId: input.followingId,
                },
            });
  
            return follow;
        }),
  
    unfollowUser: privateProcedure
        .input(
            z.object({
                followingId: z.string(),
            })
        )
        .mutation(async ({ ctx, input }) => {
            const followerId = ctx.userId;
  
            // Find existing follow to remove it
            const existingFollow = await ctx.prisma.follow.findFirst({
                where: {
                    followerId,
                    followingId: input.followingId,
                },
            });
  
            if (!existingFollow) {
                throw new TRPCError({
                    code: "NOT_FOUND",
                    message: "You are not following this user",
                });
            }
  
            await ctx.prisma.follow.delete({
                where: {
                    id: existingFollow.id,
                },
            });
  
            return { message: "Unfollowed successfully" };
        }),

    isFollowing: privateProcedure
        .input(z.object({ userId: z.string() }))
        .query(async ({ ctx, input }) => {
            const followerId = ctx.userId;
            if (!followerId) throw new TRPCError({ code: "UNAUTHORIZED" });

            const follow = await ctx.prisma.follow.findFirst({
                where: { followerId, followingId: input.userId },
            });

            return { isFollowing: !!follow };
        }),
  });