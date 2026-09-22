import Link from 'next/link';
import Header from '@/components/header';
import { createAsyncCaller } from '@/app/api/trpc/trpc-router';
import { romano, urlTemporada, etiquetaEstado, claseEstado } from '@/lib/season-ui';

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
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-3xl px-4">
                    <h1 className="mb-2 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        Temporadas
                    </h1>
                    <p className="mb-8 text-center text-gray-400">
                        Todas las ligas y su historial. Las temporadas cerradas se conservan
                        tal como terminaron.
                    </p>

                    {ligas.length === 0 && (
                        <p className="text-center text-gray-400">Todavía no hay ligas registradas.</p>
                    )}

                    <div className="space-y-8">
                        {ligas.map((liga) => (
                            <div key={liga.id}>
                                <h2 className="mb-3 text-2xl font-semibold text-white">{liga.name}</h2>
                                {liga.seasons.length === 0 ? (
                                    <p className="text-gray-500">Sin temporadas todavía.</p>
                                ) : (
                                    <ul className="grid gap-3 sm:grid-cols-2">
                                        {liga.seasons.map((s) => (
                                            <li key={s.id}>
                                                <Link
                                                    href={urlTemporada(liga, s.number)}
                                                    className="flex items-center justify-between gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-4 transition hover:border-pink-500/50"
                                                >
                                                    <span>
                                                        <span className="block font-semibold text-white">
                                                            Temporada {romano(s.number)}
                                                        </span>
                                                        <span className="text-sm text-gray-500">
                                                            {s._count.teamSeasons}{' '}
                                                            {s._count.teamSeasons === 1 ? 'equipo' : 'equipos'}
                                                        </span>
                                                    </span>
                                                    <span className={`rounded-full border px-2 py-0.5 text-xs ${claseEstado[s.status]}`}>
                                                        {etiquetaEstado[s.status]}
                                                    </span>
                                                </Link>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        ))}
                    </div>
                </div>
            </section>
        </>
    );
}
