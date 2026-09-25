import Link from 'next/link';
import Header from '@/components/header';
import { Pagina, EncabezadoPagina, ContenidoAdmin } from '@/components/ui/pagina';
import { claseBoton } from '@/components/ui/boton';
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
            <Pagina>
                <ContenidoAdmin>
                    <EncabezadoPagina
                        antetitulo="Administración"
                        titulo="Partidos"
                        descripcion="Sedes, rol de juegos y resultados de cada temporada."
                        acciones={
                            <Link href="/ligas" className={claseBoton({ variante: 'secundario', tamano: 'sm' })}>
                                Ver páginas públicas
                            </Link>
                        }
                    />
                    <PartidosPanel />
                </ContenidoAdmin>
            </Pagina>
        </>
    );
}
