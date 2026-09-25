import Link from 'next/link';
import Header from '@/components/header';
import { Pagina, EncabezadoPagina, ContenidoAdmin } from '@/components/ui/pagina';
import { claseBoton } from '@/components/ui/boton';
import { getAdminUser } from '@/utils/get-auth-user';
import TemporadasPanel from './temporadas-panel';

// Página PROTEGIDA (solo admin), igual que /manejar-equipos y /manejar-jugadores.
// Server component sin 'use client': renderiza el Header (que es async) y
// delega toda la interactividad a temporadas-panel.tsx.
export default async function ManejarTemporadasPage() {
    await getAdminUser();

    return (
        <>
            <Header />
            <Pagina>
                <ContenidoAdmin>
                    <EncabezadoPagina
                        antetitulo="Administración"
                        titulo="Temporadas"
                        descripcion="Ligas, temporadas y los equipos inscritos en cada una."
                        acciones={
                            <Link href="/ligas" className={claseBoton({ variante: 'secundario', tamano: 'sm' })}>
                                Ver páginas públicas
                            </Link>
                        }
                    />
                    <TemporadasPanel />
                </ContenidoAdmin>
            </Pagina>
        </>
    );
}
