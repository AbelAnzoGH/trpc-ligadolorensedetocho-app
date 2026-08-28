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
 * Hoy `equipos` llega vacío y se muestran siluetas. Cuando los equipos tengan
 * su campo de logo, se le pasa el arreglo real y esto no cambia.
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
            className="relative overflow-hidden border-y border-gray-800 bg-gray-900/30 py-6"
            aria-label="Equipos de la liga"
        >
            {/* Degradados en los bordes para que los logos aparezcan y
                desaparezcan suavemente en vez de cortarse de golpe. */}
            <div className="pointer-events-none absolute inset-y-0 left-0 z-10 w-16 bg-linear-to-r from-gray-950 to-transparent" />
            <div className="pointer-events-none absolute inset-y-0 right-0 z-10 w-16 bg-linear-to-l from-gray-950 to-transparent" />

            <ul className="animate-marquee flex w-max items-center gap-12">
                {listaDoble.map((equipo, indice) => (
                    <li
                        key={`${equipo.id}-${indice}`}
                        // La segunda copia es decorativa: quien use lector de
                        // pantalla no necesita oír la lista dos veces.
                        aria-hidden={indice >= elementos.length}
                        className="flex shrink-0 flex-col items-center gap-2"
                    >
                        {equipo.nombre ? (
                            <>
                                {equipo.logoUrl ? (
                                    // eslint-disable-next-line @next/next/no-img-element
                                    <img
                                        src={equipo.logoUrl}
                                        alt=""
                                        className="h-14 w-14 object-contain"
                                    />
                                ) : (
                                    // Sin logo propio todavía: se usa el de la liga.
                                    <LogoLiga className="h-10 w-auto opacity-70" title="" />
                                )}
                                <span className="text-xs font-semibold text-gray-400">
                                    {equipo.nombre}
                                </span>
                            </>
                        ) : (
                            <div className="h-14 w-14 rounded-full border border-dashed border-gray-700" />
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}
