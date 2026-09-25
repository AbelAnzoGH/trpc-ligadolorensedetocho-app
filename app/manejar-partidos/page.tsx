import Link from 'next/link';
import Header from '@/components/header';
import { getAdminUser } from '@/utils/get-auth-user';
import PartidosPanel from './partidos-panel';

// Página PROTEGIDA (solo admin), igual que /manejar-temporadas.
// Server component sin 'use client': renderiza el Header (que es async) y
// delega toda la interactividad a partidos-panel.tsx.
export default async function ManejarPartidosPage() {
    await getAdminUser();

    return (
        <>
            <Header />
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-4xl px-4">
                    <h1 className="mb-2 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        Manejar partidos
                    </h1>
                    <p className="mb-8 text-center text-gray-400">
                        Sedes, rol de juegos y resultados de cada temporada.{' '}
                        <Link href="/ligas" className="text-pink-500 hover:text-pink-400">
                            Ver las páginas públicas
                        </Link>
                    </p>
                    <PartidosPanel />
                </div>
            </section>
        </>
    );
}
