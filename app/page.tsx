import Link from 'next/link';
import Header from '@/components/header';
import { createAsyncCaller } from '@/app/api/trpc/trpc-router';
import MarqueeEquipos from '@/components/marquee-equipos';
import SeccionPlaceholder from '@/components/seccion-placeholder';

export default async function Home() {
  // Los equipos se piden en el SERVIDOR, con el mismo router de tRPC pero
  // llamándolo directo (sin pasar por HTTP). Así el marquee llega ya
  // renderizado en el HTML, sin parpadeo de "cargando".
  // Si algo falla, la cinta se muestra con siluetas en vez de tumbar la portada.
  const equipos = await createAsyncCaller()
    .then((caller) => caller.listTeams(undefined))
    .then((resultado) =>
      resultado.data.teams.map((equipo) => ({
        id: equipo.id,
        nombre: equipo.name,
        logoUrl: equipo.logoUrl,
      })),
    )
    .catch(() => []);

  return (
    <>
      <Header />

      <main className="bg-gray-950">
        {/* ================= Bienvenida ================= */}
        <section className="px-4 pt-20 pb-16">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold text-white sm:text-5xl lg:text-6xl">
              Bienvenido a la{' '}
              <span className="bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent">
                Ligadolorense de Tocho
              </span>
            </h1>

            <p className="mx-auto mt-6 max-w-2xl text-lg text-gray-400">
              Consulta los equipos de la liga, los jugadores de cada categoría y,
              muy pronto, la tabla de clasificaciones y las estadísticas de la temporada.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-3">
              <Link
                href="/equipos"
                className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-6 py-2.5 font-semibold text-white transition duration-300 hover:bg-linear-to-l"
              >
                Ver equipos
              </Link>
              <Link
                href="/jugadores"
                className="rounded-full border border-gray-600 px-6 py-2.5 font-semibold text-gray-300 transition hover:border-gray-400 hover:text-white"
              >
                Ver jugadores
              </Link>
            </div>
          </div>
        </section>

        {/* ================= Cinta de logos ================= */}
        {/* Los equipos sin logo propio muestran el escudo de la liga. */}
        <MarqueeEquipos equipos={equipos} />

        {/* ================= Clasificaciones y estadísticas ================= */}
        <section className="px-4 py-16">
          <div className="mx-auto grid max-w-5xl gap-6 lg:grid-cols-2">
            <SeccionPlaceholder
              titulo="Tabla de clasificaciones"
              descripcion="Posiciones de cada equipo por categoría: partidos jugados, ganados, perdidos y puntos."
            />

            <SeccionPlaceholder
              titulo="Estadísticas"
              descripcion="Líderes de la temporada en touchdowns, pases de touchdown, intercepciones y safeties."
            />
          </div>
        </section>

        {/* ================= Galería ================= */}
        <section className="px-4 pb-20">
          <div className="mx-auto max-w-5xl">
            <SeccionPlaceholder
              titulo="Fotos destacadas"
              descripcion="Los mejores momentos de la jornada."
              aviso="Galería vacía"
            >
              {/* Rejilla de huecos: así se ve desde ahora cómo va a quedar
                  la galería cuando existan las fotos. */}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div
                    key={i}
                    className="flex aspect-square items-center justify-center rounded-lg border border-dashed border-gray-700"
                  >
                    <span className="text-xs uppercase tracking-widest text-gray-700">
                      Foto
                    </span>
                  </div>
                ))}
              </div>
            </SeccionPlaceholder>
          </div>
        </section>
      </main>
    </>
  );
}
