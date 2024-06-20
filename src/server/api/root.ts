import { postsRouter, reactionsRouter } from "./routers/posts";
import { profileRouter } from "./routers/profile";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    posts: postsRouter,
    profile: profileRouter,
    reactions: reactionsRouter,
});

export type AppRouter = typeof appRouter;
