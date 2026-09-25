import Link from 'next/link';
import Header from '@/components/header';
import { Pagina, EncabezadoPagina, ContenidoAdmin } from '@/components/ui/pagina';
import { claseBoton } from '@/components/ui/boton';
import { claseEnlace } from '@/components/ui/enlace';
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
            <Pagina>
                <ContenidoAdmin>
                    <EncabezadoPagina
                        antetitulo="Administración"
                        titulo="Equipos"
                        descripcion={
                            <>
                                El nombre y el logo de cada equipo, que se quedan para siempre. Las inscripciones por
                                temporada, en{' '}
                                <Link href="/manejar-temporadas" className={claseEnlace}>
                                    Temporadas
                                </Link>
                                .
                            </>
                        }
                        acciones={
                            <Link href="/equipos" className={claseBoton({ variante: 'secundario', tamano: 'sm' })}>
                                Ver listado público
                            </Link>
                        }
                    />
                    <EquiposPanel />
                </ContenidoAdmin>
            </Pagina>
        </>
    );
}
