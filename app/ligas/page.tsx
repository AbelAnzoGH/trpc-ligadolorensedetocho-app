import Link from 'next/link';
import Header from '@/components/header';
import Insignia from '@/components/ui/insignia';
import { Pagina, EncabezadoPagina, TituloSeccion } from '@/components/ui/pagina';
import { claseTarjeta } from '@/components/ui/tarjeta';
import { Vacio } from '@/components/ui/estado';
import { createAsyncCaller } from '@/app/api/trpc/trpc-router';
import { romano, urlTemporada, etiquetaEstado, tonoEstadoTemporada } from '@/lib/season-ui';

// Página PÚBLICA: el índice de todas las ligas y sus temporadas.
// No lleva componente 'use client' porque no tiene nada interactivo: son
// solo enlaces, y se pintan en el servidor con los datos ya resueltos.
export default async function LigasPage() {
    // Mismo patrón que la portada: se llama al router de tRPC directo, sin
    // pasar por HTTP. Si algo falla, la página muestra la lista vacía en vez
    // de tumbarse.
    const ligas = await createAsyncCaller()
        .then((caller) => caller.listLeagues())
        .then((r) => r.data.leagues)
        .catch(() => []);

    return (
        <>
            <Header />
            <Pagina>
                <EncabezadoPagina
                    titulo="Temporadas"
                    descripcion="Todas las ligas y su historial. Las temporadas cerradas se conservan tal como terminaron."
                />

                {ligas.length === 0 && <Vacio>Todavía no hay ligas registradas.</Vacio>}

                <div className="space-y-12">
                    {ligas.map((liga) => (
                        <section key={liga.id}>
                            <TituloSeccion>{liga.name}</TituloSeccion>
                            {liga.seasons.length === 0 ? (
                                <Vacio>Sin temporadas todavía.</Vacio>
                            ) : (
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {liga.seasons.map((s) => (
                                        <li key={s.id}>
                                            {/* Toda la tarjeta es el enlace: tarjeta interactiva. */}
                                            <Link
                                                href={urlTemporada(liga, s.number)}
                                                className={claseTarjeta({
                                                    variante: 'panel',
                                                    interactiva: true,
                                                    className: 'flex items-center justify-between gap-3 sm:p-5',
                                                })}
                                            >
                                                <span>
                                                    <span className="block text-cuerpo-lg font-semibold text-tinta">
                                                        Temporada {romano(s.number)}
                                                    </span>
                                                    <span className="text-meta text-tenue">
                                                        {s._count.teamSeasons}{' '}
                                                        {s._count.teamSeasons === 1 ? 'equipo' : 'equipos'}
                                                    </span>
                                                </span>
                                                <Insignia tono={tonoEstadoTemporada[s.status]}>
                                                    {etiquetaEstado[s.status]}
                                                </Insignia>
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            )}
                        </section>
                    ))}
                </div>
            </Pagina>
        </>
    );
}
