import authRouter from "@/lib/server/auth-route";
import teamRouter from "@/lib/server/team-route";
import playerRouter from "@/lib/server/player-route";
import { getUserHandler } from "@/lib/server/user-controller";
import { createContext } from "@/utils/trpc-context";
import { protectedProcedure, t } from "@/utils/trpc-server";

const statusCheckRouter = t.router({
    statuschecker: t.procedure.query(() => {
        return {
            status: 'success',
            message: 'Bienvenido al servidor TRPC de Ligado Lorense de Tocho',
        }
    })
})

const userRouter = t.router({
    getUser: protectedProcedure.query(({ ctx }) => getUserHandler({ ctx })),
});

export const appRouter = t.mergeRouters(
    statusCheckRouter,
    authRouter,
    userRouter,
    teamRouter,
    playerRouter
)

export const createCaller = t.createCallerFactory(appRouter)

export const createAsyncCaller = async () => {
    const context = await createContext();

    return createCaller(context);

}

export type AppRouter = typeof appRouter;