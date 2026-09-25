import Link from 'next/link';
import Header from '@/components/header';
import Acceso from '@/components/acceso';
import { claseEnlace } from '@/components/ui/enlace';
import RegisterForm from './register-form';

export default async function RegisterPage() {
    return (
        <>
            <Header />
            <Acceso
                titulo="Crea tu cuenta"
                descripcion="¡Regístrate ahora para comenzar!"
                pie={
                    <>
                        ¿Ya tienes cuenta?{' '}
                        <Link href="/login" className={claseEnlace}>
                            Inicia sesión
                        </Link>
                    </>
                }
            >
                <RegisterForm />
            </Acceso>
        </>
    );
}
