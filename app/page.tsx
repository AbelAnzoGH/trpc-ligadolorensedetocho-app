import Link from 'next/link';
import Header from '@/components/header';
import { createAsyncCaller } from '@/app/api/trpc/trpc-router';
import MarqueeEquipos from '@/components/marquee-equipos';
import SeccionPlaceholder from '@/components/seccion-placeholder';
import CarruselPosiciones, { type DiapositivaPosiciones } from '@/components/carrusel-posiciones';
import CarruselJornadas, { type DiapositivaJornada } from '@/components/carrusel-jornadas';
import { agruparPorJornada, type Game } from '@/lib/game-ui';
import { nombreTemporada } from '@/lib/season-ui';
import { etiquetaCategoria } from '@/lib/team-ui';
import Insignia from '@/components/ui/insignia';
import { claseBoton } from '@/components/ui/boton';

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

  // Las tablas de las temporadas en curso, aplanadas: una diapositiva por
  // (temporada, categoría). Mismo criterio que la cinta: si algo falla, la
  // sección se queda con su estado vacío en vez de tumbar la portada.
  const diapositivas: DiapositivaPosiciones[] = await createAsyncCaller()
    .then((caller) => caller.listActiveStandings())
    .then((r) =>
      r.data.temporadas.flatMap(({ temporada, tablas, conEmpates }) => {
        const nombre = nombreTemporada(temporada.league, temporada.number);
        return tablas.map((tabla) => ({
          clave: `${temporada.id}:${tabla.category}`,
          temporada: nombre,
          categoria: etiquetaCategoria[tabla.category],
          tabla,
          conEmpates,
        }));
      }),
    )
    .catch(() => []);

  // La última jornada jugada de cada liga, una diapositiva por liga.
  // createAsyncCaller llama al handler directo, así que scheduledAt llega
  // como Date: se pasa a texto ISO para que coincida con el tipo Game que
  // espera el navegador (igual que en la página de la temporada).
  const jornadas: DiapositivaJornada[] = await createAsyncCaller()
    .then((caller) => caller.listLatestRounds())
    .then((r) =>
      r.data.jornadas.map(({ temporada, games }) => {
        const partidos: Game[] = games.map((g) => ({ ...g, scheduledAt: g.scheduledAt.toISOString() }));
        // Todos los partidos son del mismo grupo (jornada o fase): agruparPorJornada
        // devuelve uno solo y de él salen el título y el día común.
        const [grupo] = agruparPorJornada(partidos);
        const nombre = nombreTemporada(temporada.league, temporada.number);
        return {
          clave: temporada.id,
          temporada: nombre,
          enlace: `/ligas/${temporada.league.slug}/${temporada.number}`,
          titulo: grupo.titulo,
          dia: grupo.diaComun,
          partidos,
        };
      }),
    )
    .catch(() => []);

  return (
    <>
      <Header />

      <main>
        {/* ================= Bienvenida (design.md → Patrones → Hero) ================= */}
        {/* Alineado a la izquierda, no centrado: un título grande alineado a
            la izquierda se lee como editorial; centrado se lee como póster. */}
        <section className="mx-auto max-w-pagina px-4 pt-16 pb-12 sm:px-6 sm:pt-24 sm:pb-20">
          <Insignia tono="contorno">Tocho bandera · Dolores Hidalgo, Gto.</Insignia>

          {/* El título tiene dos partes con jerarquía distinta:
              - "Bienvenido a la": introducción, más chica y en tinta-2.
              - El nombre: es la marca, así que es lo más grande. Va todo
                junto, y como 20 letras sin espacios no se pueden partir,
                usa `text-marca`, un tamaño que se calcula con el ancho de
                pantalla (ver globals.css). `wrap-anywhere` es solo un
                seguro para pantallas de menos de 300px. */}
          <h1 className="mt-6 font-semibold">
            <span className="block text-subtitulo text-tinta-2 sm:text-titulo-sm lg:text-titulo">
              Bienvenido a la
            </span>
            <span className="mt-1 block text-marca text-tinta wrap-anywhere">LIGADOLORENSEDETOCHO</span>
          </h1>

          <p className="mt-6 max-w-2xl text-cuerpo-lg text-tenue">
            Consulta los equipos de la liga, los jugadores de cada categoría, la
            tabla de posiciones y, muy pronto, las estadísticas de la temporada.
          </p>

          <div className="mt-10 flex flex-wrap gap-3">
            <Link href="/equipos" className={claseBoton({ variante: 'primario', tamano: 'lg' })}>
              Ver equipos
            </Link>
            <Link href="/jugadores" className={claseBoton({ variante: 'secundario', tamano: 'lg' })}>
              Ver jugadores
            </Link>
          </div>
        </section>

        {/* ================= Cinta de logos ================= */}
        {/* Los equipos sin logo propio muestran el escudo de la liga. */}
        <MarqueeEquipos equipos={equipos} />

        {/* ================= Marcadores de la última jornada ================= */}
        {/* Sin ligas con partidos jugados, SeccionPlaceholder muestra su aviso.
            Va sin padding abajo: la sección siguiente ya trae el suyo arriba. */}
        <section className="mx-auto max-w-pagina px-4 pt-12 sm:px-6 sm:pt-20">
          <SeccionPlaceholder
            titulo="Marcadores"
            descripcion="La última jornada jugada de cada liga."
            aviso="Todavía no hay jornadas jugadas"
          >
            {jornadas.length > 0 ? <CarruselJornadas diapositivas={jornadas} /> : undefined}
          </SeccionPlaceholder>
        </section>

        {/* ================= Clasificaciones y estadísticas ================= */}
        <section className="mx-auto max-w-pagina px-4 py-12 sm:px-6 sm:py-20">
          <div className="grid gap-4 lg:grid-cols-2">
            {/* Sin temporadas en curso, SeccionPlaceholder muestra su aviso. */}
            <SeccionPlaceholder
              titulo="Tabla de posiciones"
              descripcion="Las temporadas en curso, por categoría."
              aviso="No hay temporadas en curso"
            >
              {diapositivas.length > 0 ? <CarruselPosiciones diapositivas={diapositivas} /> : undefined}
            </SeccionPlaceholder>

            <SeccionPlaceholder
              titulo="Estadísticas"
              descripcion="Líderes de la temporada en touchdowns, pases de touchdown, intercepciones y safeties."
            />
          </div>
        </section>

        {/* ================= Galería ================= */}
        {/* Sin la rejilla de 8 huecos grises: mientras no haya fotos, una
            sección vacía se muestra como estado vacío (design.md → Imágenes). */}
        <section className="mx-auto max-w-pagina px-4 pb-12 sm:px-6 sm:pb-20">
          <SeccionPlaceholder
            titulo="Fotos destacadas"
            descripcion="Los mejores momentos de la jornada."
            aviso="Todavía no hay fotos"
          />
        </section>
      </main>
    </>
  );
}
