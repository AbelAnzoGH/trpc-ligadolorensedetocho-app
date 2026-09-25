import LogoLiga from './logo-liga';

type LogoEquipo = { id: string; nombre: string; logoUrl?: string | null };

/**
 * Cinta de logos de equipos que se desplaza de derecha a izquierda, en bucle.
 *
 * Cómo funciona el bucle infinito sin cortes: la lista se pinta DOS VECES
 * seguidas, y la animación mueve el contenedor exactamente -50% de su ancho.
 * Cuando termina, la segunda copia está justo donde estaba la primera, así
 * que al reiniciarse el salto es invisible. La animación vive en globals.css
 * como `.animate-marquee`.
 *
 * Diseño (design.md → Patrones → Cinta de logos): los logos van en escala de
 * grises y semitransparentes para no competir con el contenido; al pasar el
 * mouse sobre uno recupera su color. La cinta ya se detiene con el hover
 * (globals.css), así que se puede ver un logo concreto con calma.
 */
export default function MarqueeEquipos({ equipos = [] }: { equipos?: LogoEquipo[] }) {
    // Sin equipos todavía: ocho siluetas para que la cinta no se vea rota.
    const elementos: LogoEquipo[] =
        equipos.length > 0
            ? equipos
            : Array.from({ length: 8 }, (_, i) => ({ id: `hueco-${i}`, nombre: '' }));

    const listaDoble = [...elementos, ...elementos];

    return (
        <div
            className="relative overflow-hidden border-y border-borde py-8"
            aria-label="Equipos de la liga"
        >
            {/* Degradados en los bordes para que los logos aparezcan y
                desaparezcan suavemente. Van del color del fondo (canvas) a
                transparente; es la única excepción a "sin degradados" porque
                no es decoración, es un desvanecido. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-24 bg-linear-to-r from-canvas to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-24 bg-linear-to-l from-canvas to-transparent" />

            <ul className="animate-marquee flex w-max items-center gap-14">
                {listaDoble.map((equipo, indice) => (
                    <li
                        key={`${equipo.id}-${indice}`}
                        // La segunda copia es decorativa: quien use lector de
                        // pantalla no necesita oír la lista dos veces.
                        aria-hidden={indice >= elementos.length}
                        className="flex shrink-0 flex-col items-center gap-2"
                    >
                        {equipo.nombre ? (
                            <span
                                title={equipo.nombre}
                                className="flex h-14 items-center opacity-60 grayscale transition duration-300 hover:opacity-100 hover:grayscale-0"
                            >
                                {equipo.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={equipo.logoUrl}
                                        alt={equipo.nombre}
                                        className="h-14 w-14 object-contain"
                                    />
                                ) : (
                                    // Sin logo propio todavía: se usa el de la liga.
                                    <LogoLiga className="h-10 w-auto" title={equipo.nombre} />
                                )}
                            </span>
                        ) : (
                            <div className="size-14 rounded-full border border-dashed border-borde-fuerte" />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
