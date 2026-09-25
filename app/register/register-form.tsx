'use client';

import { useForm, SubmitHandler, FormProvider } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useRouter } from 'next/navigation';
import { CreateUserInput, createUserSchema } from '@/lib/user-schema';
import { trpc } from '@/utils/trpc';
import FormInput from '@/components/form-input';
import { LoadingButton } from '@/components/loading-button';

export default function RegisterForm() {
    const router = useRouter();
    const [submitting, setSubmitting] = useState(false);

    const methods = useForm<CreateUserInput>({
        resolver: zodResolver(createUserSchema),
    });

    const { reset, handleSubmit } = methods;

    const { mutate: registerFn } = trpc.registerUser.useMutation({
        onMutate() {
            setSubmitting(true);
        },
        onSettled() {
            setSubmitting(false);
        },
        onError(error) {
            reset({ password: '', passwordConfirm: '' });
            toast.error(error.message);
            console.log('Error message:', error.message);
        },
        onSuccess() {
            toast.success('Cuenta creada. Ya puedes iniciar sesión.');
            router.push('/login');
        },
    });

    const onSubmitHandler: SubmitHandler<CreateUserInput> = (values) => {
        registerFn(values);
    };

    return (
        <FormProvider {...methods}>
            {/* La tarjeta y el enlace a "Inicia sesión" los pone la página
                (components/acceso.tsx); el formulario solo lleva los campos. */}
            <form onSubmit={handleSubmit(onSubmitHandler)} className='space-y-5'>
                <FormInput label='Nombre completo' name='name' />
                <FormInput label='Correo electrónico' name='email' type='email' />
                <FormInput label='Contraseña' name='password' type='password' />
                <FormInput label='Confirma tu contraseña' name='passwordConfirm' type='password' />

                <LoadingButton loading={submitting}>Crear cuenta</LoadingButton>
            </form>
        </FormProvider>
    );
}