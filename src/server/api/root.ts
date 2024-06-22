import { postsRouter, reactionsRouter } from "./routers/posts";
import { profileRouter, followRouter } from "./routers/profile";
import { createTRPCRouter } from "./trpc";

export const appRouter = createTRPCRouter({
    posts: postsRouter,
    profile: profileRouter,
    reactions: reactionsRouter,
    follow: followRouter,
});

export type AppRouter = typeof appRouter;
