import Link from 'next/link';
import { notFound } from 'next/navigation';
import { TRPCError } from '@trpc/server';
import Header from '@/components/header';
import { createAsyncCaller } from '@/app/api/trpc/trpc-router';
import { nombreTemporada, etiquetaEstado, claseEstado } from '@/lib/season-ui';
import type { Game } from '@/lib/game-ui';
import TemporadaEquipos from './temporada-equipos';
import TemporadaPartidos from './temporada-partidos';

/**
 * La página PÚBLICA de cada temporada: /ligas/ldt/7, /ligas/shadows/2, ...
 *
 * UN solo archivo sirve a TODAS las temporadas, incluidas las que todavía no
 * existen: la ruta es el molde y [liga] + [numero] son la llave. Cuando el
 * admin crea "LDT VIII", solo se inserta una fila en la base; la dirección
 * /ligas/ldt/8 empieza a funcionar sola, sin volver a desplegar.
 *
 * ¿Por qué funciona sin redeploy? Porque la página se genera en cada visita
 * (render dinámico): el <Header /> lee la cookie de sesión, y leer cookies
 * obliga a Next a no prerenderizarla. Cuando algún día se quiera cachear las
 * temporadas CERRADAS (nunca cambian), el campo `status` ya dice cuáles son;
 * pero eso requiere sacar la lectura de cookies del render y queda para después.
 *
 * En esta versión de Next, `params` es una PROMESA: hay que hacer await.
 */
export default async function TemporadaPage({
    params,
}: {
    params: Promise<{ liga: string; numero: string }>;
}) {
    const { liga, numero } = await params;

    // /ligas/ldt/abc o /ligas/ldt/7.5 → 404 directo, sin consultar la base.
    const number = Number(numero);
    if (!Number.isInteger(number) || number < 1) notFound();

    const caller = await createAsyncCaller();
    const season = await caller
        .getSeasonBySlug({ leagueSlug: liga, number })
        .then((r) => r.data.season)
        .catch((err: unknown) => {
            // Solo el "no existe" se vuelve 404. Cualquier otro error (la base
            // caída, por ejemplo) se deja subir para que Next muestre su
            // página de error: disfrazarlo de 404 escondería el problema real.
            if (err instanceof TRPCError && err.code === 'NOT_FOUND') return null;
            throw err;
        });

    if (!season) notFound();

    const titulo = nombreTemporada(season.league, season.number);

    // Los partidos se piden aquí, en el servidor, igual que la temporada: la
    // página llega completa y la sección no necesita "cargando".
    // createAsyncCaller llama al handler directo (sin HTTP), así que
    // scheduledAt llega como Date. Se pasa a texto ISO para que coincida con
    // el tipo Game de lib/game-ui.ts, el mismo que usa el panel de admin.
    const partidos: Game[] = await caller
        .listGames({ seasonId: season.id })
        .then((r) => r.data.games.map((g) => ({ ...g, scheduledAt: g.scheduledAt.toISOString() })));

    return (
        <>
            <Header />
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-4xl px-4">
                    <p className="mb-2 text-center text-sm">
                        <Link href="/ligas" className="text-gray-500 hover:text-pink-400">
                            ← Todas las temporadas
                        </Link>
                    </p>
                    <h1 className="mb-3 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        {titulo}
                    </h1>
                    <p className="mb-8 text-center">
                        <span className={`rounded-full border px-3 py-1 text-sm ${claseEstado[season.status]}`}>
                            {etiquetaEstado[season.status]}
                        </span>
                    </p>

                    {/* Cada sección de la temporada es un componente aparte:
                        agregar una (la tabla de posiciones, el próximo sprint)
                        es agregar una línea aquí, sin reescribir la página. */}
                    <div className="space-y-12">
                        <TemporadaPartidos partidos={partidos} categorias={season.categories} />
                        <TemporadaEquipos inscripciones={season.teamSeasons} temporada={titulo} />
                    </div>
                </div>
            </section>
        </>
    );
}
