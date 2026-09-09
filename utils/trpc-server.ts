import { TRPCError, initTRPC } from '@trpc/server';
import SuperJSON from 'superjson';
import { Context } from './trpc-context'

export const t = initTRPC.context<Context>().create({
    transformer: SuperJSON,
});

const isAuthed = t.middleware(({next, ctx}) => {
    if (!ctx.user) {
        throw new TRPCError({
            code: 'UNAUTHORIZED',
            message: 'Debes iniciar sesión para acceder a este recurso',
        });
    }
    return next();
})

const isAdmin = t.middleware(({next, ctx}) => {
    if (ctx.user?.role !== 'admin') {
        throw new TRPCError({
            code: 'FORBIDDEN',
            message: 'No tienes permisos de administrador para acceder a este recurso',
        });
    }

    return next();
});

export const publicProcedure = t.procedure;
export const protectedProcedure = t.procedure.use(isAuthed);
export const adminProcedure = protectedProcedure.use(isAdmin);