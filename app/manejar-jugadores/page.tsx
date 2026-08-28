import Link from 'next/link';
import Header from '@/components/header';
import { getAuthUser } from '@/utils/get-auth-user';
import JugadoresPanel from './jugadores-panel';

// Página PROTEGIDA: getAuthUser() redirige a /login si no hay sesión.
export default async function ManejarJugadoresPage() {
    await getAuthUser();

    return (
        <>
            <Header />
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-3xl px-4">
                    <h1 className="mb-2 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        Manejar jugadores
                    </h1>
                    <p className="mb-8 text-center text-gray-400">
                        Registra jugadores y asígnalos a equipos.{' '}
                        <Link href="/manejar-equipos" className="text-pink-500 hover:text-pink-400">
                            Manejar equipos
                        </Link>
                    </p>
                    <JugadoresPanel />
                </div>
            </section>
        </>
    );
}
