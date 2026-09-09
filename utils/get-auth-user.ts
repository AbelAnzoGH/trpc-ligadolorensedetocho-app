'use server';
import { createAsyncCaller } from "@/app/api/trpc/trpc-router";
import { redirect } from 'next/navigation'

export const getAuthUser = async ({
    shouldRedirect = true,
}: {
    shouldRedirect?: boolean;   
} = {}) => {
    const caller = await createAsyncCaller();
    return caller 
        .getUser(undefined)
        .then((result) => result.data.user)
        .catch((e) => {
            if (e.code === 'UNAUTHORIZED' && shouldRedirect){
                redirect('/login');
            }


            return null;
        })
}

export const getAdminUser = async ({
    shouldRedirect = true,
}: {
    shouldRedirect?: boolean;
} = {}) => {
    const caller = await createAsyncCaller();

    let user;
    try {
        const result = await caller.getUser(undefined);
        user = result.data.user;
    } catch (e: unknown) {
        const code = e instanceof Object && 'code' in e ? e.code : undefined;
        if (code === 'UNAUTHORIZED' && shouldRedirect) {
            redirect('/login');
        }
        return null;
    }

    // Fuera del try/catch: si redirect() lanza aquí, nada la va a atrapar
    // por error como si fuera una falla de caller.getUser().
    if (!user || user.role !== 'admin') {
        if (shouldRedirect) {
            redirect('/');
        }
        return null;
    }

    return user;
}