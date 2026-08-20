import { CreateUserInput, LoginUserInput } from '@/lib/user-schema'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'
import { TRPCError } from '@trpc/server'
import jwt from 'jsonwebtoken'
import { cookies } from 'next/headers'
import { Prisma } from '@/app/generated/prisma'

export const registerHandler = async({
    input,
}: {
    input: CreateUserInput;
}) => {
    try {
        const hashedPassword = await bcrypt.hash(input.password, 10);

        const user = await prisma.user.create({
            data: {
                email: input.email,
                name: input.name,
                password: hashedPassword,
            },
        });

        const {password, ...userWithoutPassword} = user;

        return {
            status: 'success',
            data: {
                user: userWithoutPassword,
            }
        }

    } catch (err: unknown) {
        if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002') {
            throw new TRPCError({
                code: 'CONFLICT',
                message: 'Email already exists',
            });
        }
        throw err;
    }
}

export const loginHandler = async({
    input,
}: {
    input: LoginUserInput;
}) => {
    try {
        const user = await prisma.user.findUnique({
            where: {
                email: input.email,
            }
        });

        if (!user || !(await bcrypt.compare(input.password, user.password))) {
            throw new TRPCError({
                code: 'BAD_REQUEST',
                message: 'Invalid email or password',
            });
        }


        // Generate JWT token
        const secret = process.env.JWT_SECRET!;
        const token = jwt.sign({ sub: user.id }, secret, {
            expiresIn: '1h', // Token expires in 1 hour
        })

        // Set the token in an HTTP-only cookie
        const cookieOptions = {
            httpOnly: true,
            path: '/',
            secure: process.env.NODE_ENV === 'development', // Use secure cookies in production
            maxAge: 60 * 60, // 1 hour in seconds
        };

        return{
            status: 'success',
            token,
        }
    } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) });
    }
}

export const logoutHandler = async() => {
    try {
        (await cookies()).set('token','', {
            maxAge: -1, // Expire the cookie immediately
        });
        return {
            status: 'success',
            message: 'Logged out successfully',
        }
    } catch (err: unknown) {
        if (err instanceof Error) throw err;
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: String(err) });
    }
};
