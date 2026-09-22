import Link from 'next/link';
import Header from '@/components/header';
import { getAdminUser } from '@/utils/get-auth-user';
import EquiposPanel from './equipos-panel';

// Página PROTEGIDA. getAuthUser() sin argumentos usa shouldRedirect = true:
// si no hay sesión, redirige a /login ANTES de mandar HTML al navegador.
// Es la misma protección que ya usa el backend con protectedProcedure,
// pero aplicada a la navegación, para que el usuario no vea una pantalla
// que de todas formas le va a fallar en cada botón.
export default async function ManejarEquiposPage() {
    await getAdminUser();

    return (
        <>
            <Header />
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-3xl px-4">
                    <h1 className="mb-2 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        Manejar equipos
                    </h1>
                    <p className="mb-8 text-center text-gray-400">
                        El nombre y el logo de cada equipo, que se quedan para siempre.
                        Las inscripciones por temporada, en{' '}
                        <Link href="/manejar-temporadas" className="text-pink-500 hover:text-pink-400">
                            Manejar temporadas
                        </Link>
                        .{' '}
                        <Link href="/equipos" className="text-pink-500 hover:text-pink-400">
                            Ver el listado público
                        </Link>
                    </p>
                    <EquiposPanel />
                </div>
            </section>
        </>
    );
}
