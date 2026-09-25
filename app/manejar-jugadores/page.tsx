import Link from 'next/link';
import Header from '@/components/header';
import { Pagina, EncabezadoPagina, ContenidoAdmin } from '@/components/ui/pagina';
import { claseBoton } from '@/components/ui/boton';
import { claseEnlace } from '@/components/ui/enlace';
import { getAdminUser } from '@/utils/get-auth-user';
import JugadoresPanel from './jugadores-panel';

// Página PROTEGIDA: getAuthUser() redirige a /login si no hay sesión.
export default async function ManejarJugadoresPage() {
    await getAdminUser();

    return (
        <>
            <Header />
            <Pagina>
                <ContenidoAdmin>
                    <EncabezadoPagina
                        antetitulo="Administración"
                        titulo="Jugadores"
                        descripcion={
                            <>
                                Registra jugadores y agrégalos a los equipos de cada temporada. Los equipos se
                                crean en{' '}
                                <Link href="/manejar-equipos" className={claseEnlace}>
                                    Equipos
                                </Link>
                                .
                            </>
                        }
                        acciones={
                            <Link href="/jugadores" className={claseBoton({ variante: 'secundario', tamano: 'sm' })}>
                                Ver listado público
                            </Link>
                        }
                    />
                    <JugadoresPanel />
                </ContenidoAdmin>
            </Pagina>
        </>
    );
}
