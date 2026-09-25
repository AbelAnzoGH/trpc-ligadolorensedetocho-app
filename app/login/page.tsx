import Link from 'next/link';
import Header from '@/components/header';
import Acceso from '@/components/acceso';
import { claseEnlace } from '@/components/ui/enlace';
import LoginForm from './login-form';

export default async function LoginPage() {
    return (
        <>
            <Header />
            <Acceso
                titulo="Bienvenido de vuelta"
                descripcion="Inicia sesión para administrar la liga."
                pie={
                    <>
                        ¿No tienes cuenta?{' '}
                        <Link href="/register" className={claseEnlace}>
                            Regístrate
                        </Link>
                    </>
                }
            >
                <LoginForm />
            </Acceso>
        </>
    );
}
