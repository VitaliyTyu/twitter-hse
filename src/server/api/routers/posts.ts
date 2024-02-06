import { z } from "zod";
import { publicProcedure, createTRPCRouter } from "../trpc";

export const postsRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    const posts = await ctx.prisma.post.findMany({
      take: 100,
      orderBy: [{ createdAt: "desc" }],
    });
    return posts;
  }),

  create: publicProcedure
    .input(
      z.object({ content: z.string(), authorId: z.string().min(1).max(255) }),
    )
    .mutation(async ({ ctx, input }) => {
      const post = await ctx.prisma.post.create({
        data: input,
      });

      return post;
    }),
});
