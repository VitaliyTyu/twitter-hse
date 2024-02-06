import { postsRouter } from "./routers/posts";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
  posts: postsRouter,
});

export type AppRouter = typeof appRouter;
