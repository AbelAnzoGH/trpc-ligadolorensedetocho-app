'use client';

import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { LoginUserInput, loginUserSchema } from '@/lib/user-schema';
import FormInput from '@/components/form-input';
import { LoadingButton } from '@/components/loading-button';
import { claseEnlace } from '@/components/ui/enlace';
import { trpc } from '@/utils/trpc';
import queryClient from '@/utils/query-client';
import toast from 'react-hot-toast';

export default function LoginForm() {
    const [submitting, setSubmitting] = useState(false);
    const router = useRouter();

    const methods = useForm<LoginUserInput>({
        resolver: zodResolver(loginUserSchema),
    });

    const { reset, handleSubmit } = methods;

    const { mutate: loginFn } = trpc.loginUser.useMutation({
        onSettled() {
            setSubmitting(false);
        },
        onMutate() {
            setSubmitting(true);
        },
        onError(error) {
            toast.error(error.message);
            console.log('Error message:', error.message);
            reset({ password: '' });
        },
        onSuccess() {
            toast.success('Sesión iniciada');
            queryClient.clear();
            router.push('/');
            router.refresh();
        },
    });

    const onSubmitHandler: SubmitHandler<LoginUserInput> = (values) => {
        loginFn(values);
    };

    return (
        <FormProvider {...methods}>
            {/* La tarjeta y el enlace a "Regístrate" los pone la página
                (components/acceso.tsx); el formulario solo lleva los campos. */}
            <form onSubmit={handleSubmit(onSubmitHandler)} className='space-y-5'>
                <FormInput label='Correo electrónico' name='email' type='email' />
                <FormInput label='Contraseña' name='password' type='password' />

                {/* FUTURO: todavía no existe la recuperación de contraseña;
                    el enlace apunta a '#' como antes. */}
                <div className='text-right'>
                    <Link href='#' className={`${claseEnlace} text-meta`}>
                        ¿Olvidaste tu contraseña?
                    </Link>
                </div>

                <LoadingButton loading={submitting}>Iniciar sesión</LoadingButton>
            </form>
        </FormProvider>
    );
}
