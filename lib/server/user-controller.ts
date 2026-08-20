import type { Context } from '@/utils/trpc-context.ts';
import { TRPCError } from '@trpc/server';

export const getUserHandler = ({ ctx }: { ctx: Context }) => {
    try{
        const user = ctx.user;

        return {
            status: 'success',
            data: {
                user,
            }
        }
    }catch (err: unknown) {
        let message = 'Error Desconocido';
        if (err instanceof Error) {
            message = err.message;
        } else if (typeof err === 'string') {
            message = err;
        } else {
            try {
                message = JSON.stringify(err);
            } catch {
                /* keep fallback message */
            }
        }
        
       
        throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message,
        });
    }
}
