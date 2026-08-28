import { createUserSchema, loginUserSchema, CreateUserInput, LoginUserInput } from '@/lib/user-schema';

import { protectedProcedure, publicProcedure, t }  from '@/utils/trpc-server';
import { loginHandler, registerHandler, logoutHandler } from '@/lib/server/auth-controller';

const authRouter = t.router({
    registerUser: publicProcedure
        .input(createUserSchema)
        .mutation(({ input }: {input: CreateUserInput}) => registerHandler({ input })),

    loginUser: publicProcedure
        .input(loginUserSchema)
        .mutation(({ input }: {input: LoginUserInput}) => loginHandler({ input })),
    logoutUser: protectedProcedure.mutation(() => logoutHandler()),
});

export default authRouter;
