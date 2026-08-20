import { TRPCError } from '@trpc/server';
import jwt from 'jsonwebtoken';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';

export const deserializeUser = async () => {
    const cookieStore = cookies();

    try {
        let token;
        if ((await cookieStore).get('token')){
            token =(await cookieStore).get('token')?.value;
        }

        const notAuthenticated = {
            user:null,
        }

        if(!token){
            return notAuthenticated;
        }

        const secret = process.env.JWT_SECRET as string;
        const decoded = jwt.verify(token, secret) as { sub: string };

        if (!decoded?.sub) {
            return notAuthenticated;
        }

        const user = await prisma.user.findUnique({
            where: {
                id: decoded.sub,
            },
        })

        if (!user) {
            return notAuthenticated;
        }

        const { password, ...userWithoutPassword } = user;
        return {
            user: userWithoutPassword,
        };


    }catch(err: unknown){
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
