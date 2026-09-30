import Link from 'next/link';
import Header from '@/components/header';
import { Pagina, EncabezadoPagina, TituloSeccion } from '@/components/ui/pagina';
import { MensajeError, Vacio } from '@/components/ui/estado';
import { claseBoton } from '@/components/ui/boton';
import TablasPorCategoria from '@/components/tablas-por-categoria';
import { createAsyncCaller } from '@/app/api/trpc/trpc-router';
import { nombreTemporada, urlTemporada } from '@/lib/season-ui';
import VerMasTablas from './ver-mas-tablas';

/**
 * Página PÚBLICA /posiciones: las tablas de todas las temporadas EN CURSO.
 *
 *   Liga → Temporada → una tabla por categoría
 *
 * Las temporadas viejas NO se cargan aquí (serían datos que casi nadie
 * pide): se consultan una por una con "Ver más", que abre un modal con
 * filtros y solo pide datos cuando alguien lo abre.
 *
 * Las tablas se calculan en el servidor (listActiveStandings), así que la
 * página llega completa, sin "cargando". Lo único interactivo (el modal y
 * el plantel de cada equipo) vive en componentes 'use client'.
 */
export default async function PosicionesPage() {
    // Si la base falla, se muestra un error en vez de "no hay temporadas en
    // curso": decir que no hay nada cuando en realidad no se pudo leer
    // escondería el problema.
    const temporadas = await createAsyncCaller()
        .then((caller) => caller.listActiveStandings())
        .then((r) => r.data.temporadas)
        .catch(() => null);

    return (
        <>
            <Header />
            <Pagina>
                <EncabezadoPagina
                    titulo="Tabla de posiciones"
                    descripcion="Las temporadas en curso, por categoría. Solo cuentan los partidos de temporada regular."
                    acciones={<VerMasTablas />}
                />

                {temporadas === null && (
                    <MensajeError>No se pudieron cargar las tablas. Intenta de nuevo en un momento.</MensajeError>
                )}

                {temporadas?.length === 0 && (
                    <Vacio accion={<VerMasTablas tamano="sm" />}>
                        No hay temporadas en curso. Puedes consultar las tablas de temporadas anteriores.
                    </Vacio>
                )}

                <div className="space-y-16">
                    {temporadas?.map((posiciones) => {
                        const { temporada } = posiciones;
                        const nombre = nombreTemporada(temporada.league, temporada.number);

                        return (
                            <section key={temporada.id}>
                                <TituloSeccion
                                    acciones={
                                        <Link
                                            href={urlTemporada(temporada.league, temporada.number)}
                                            className={claseBoton({ variante: 'fantasma', tamano: 'sm' })}
                                        >
                                            Ver temporada
                                        </Link>
                                    }
                                >
                                    {nombre}
                                </TituloSeccion>

                                <TablasPorCategoria posiciones={posiciones} temporada={nombre} />
                            </section>
                        );
                    })}
                </div>
            </Pagina>
        </>
    );
}
