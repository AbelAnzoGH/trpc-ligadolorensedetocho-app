import Insignia from '@/components/ui/insignia';
import { etiquetaCategoria } from '@/lib/team-ui';
import {
    camposEstadistica,
    etiquetaPosicion,
    type MembershipConJugador,
    type CampoEstadistica,
} from '@/lib/player-ui';

/**
 * Una tarjeta del listado público. Es puramente presentacional: recibe una
 * membresía por props y la pinta, sin estado ni eventos propios. Por eso no
 * lleva 'use client' — hereda el entorno de quien la renderiza.
 *
 * La foto sale de la MEMBRESÍA, no de la persona: quien juega en varonil y
 * en mixto tiene una foto por uniforme. Si esa membresía todavía no tiene
 * foto, se muestran sus iniciales, para que la rejilla no quede con huecos.
 *
 * Diseño (design.md → Patrones → Tarjeta de jugador): tarjeta `rounded-panel`
 * con la foto arriba de borde a borde (como la "tarjeta con imagen" de la
 * referencia), el número sobre la foto y las estadísticas al fondo. No
 * reacciona al hover: no es clicable.
 */
export default function JugadorTarjeta({ membresia }: { membresia: MembershipConJugador }) {
    const { player: jugador } = membresia;
    // Nombre y logo son del equipo (permanentes); la categoría es de la inscripción.
    const equipo = membresia.teamSeason.team;
    const iniciales = `${jugador.name[0] ?? ''}${jugador.lastName[0] ?? ''}`.toUpperCase();

    return (
        // `overflow-hidden` en el <li> es lo que hace que la foto respete las
        // esquinas redondeadas de la tarjeta. El padding va en el bloque de
        // texto, para que la imagen llegue de borde a borde.
        <li className="flex flex-col overflow-hidden rounded-panel border border-borde bg-superficie">
            {/* ---------- Foto ---------- */}
            {/*
              aspect-[4/3] fija la ALTURA a partir del ancho de la columna, así
              todas las tarjetas de la rejilla miden lo mismo aunque las fotos
              vengan en proporciones distintas.

              object-cover recorta lo que sobra para llenar el marco sin
              deformar a nadie; object-contain dejaría barras vacías a los lados.
            */}
            <div className="relative aspect-[4/3] w-full shrink-0 bg-superficie-2">
                {membresia.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={membresia.photoUrl}
                        alt={`Foto de ${jugador.name} ${jugador.lastName}`}
                        className="h-full w-full object-cover"
                    />
                ) : (
                    <div
                        aria-hidden
                        className="flex h-full w-full items-center justify-center text-titulo font-semibold text-tenue"
                    >
                        {iniciales}
                    </div>
                )}

                {/* El número encima de la foto, en una esquina. El fondo
                    semitransparente con blur lo mantiene legible tanto sobre
                    una foto clara como sobre una oscura. */}
                <span className="absolute right-3 top-3 rounded-insignia bg-canvas/80 px-2.5 py-1 text-meta font-bold tabular-nums text-tinta backdrop-blur-sm">
                    <span className="text-apagado">#</span>
                    {membresia.jerseyNumber}
                </span>
            </div>

            {/* ---------- Datos ---------- */}
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="min-w-0">
                    <h2 className="truncate text-cuerpo-lg font-semibold text-tinta">
                        {jugador.name} {jugador.lastName}
                    </h2>
                    <p className="truncate text-meta text-tenue">{equipo.name}</p>
                </div>

                <div className="flex flex-wrap items-center gap-x-2 gap-y-1.5 text-meta text-tenue">
                    <Insignia>{etiquetaCategoria[membresia.teamSeason.category]}</Insignia>
                    <span>
                        {jugador.age} años · {jugador.height} cm
                    </span>
                </div>

                <div className="flex flex-wrap gap-1.5">
                    {membresia.positions.map((posicion) => (
                        <Insignia key={posicion} tono="contorno" title={etiquetaPosicion[posicion]}>
                            {posicion}
                        </Insignia>
                    ))}
                </div>

                {/* mt-auto empuja las estadísticas al fondo de la tarjeta, para
                    que la línea divisoria quede alineada entre tarjetas aunque
                    una tenga más posiciones o un nombre más largo que otra. */}
                <dl className="mt-auto grid grid-cols-2 gap-x-4 gap-y-1.5 border-t border-borde pt-3 text-meta">
                    {camposEstadistica.map((campo) => (
                        <div key={campo.key} className="flex justify-between gap-2">
                            <dt className="truncate text-tenue">{campo.label}</dt>
                            <dd className="font-semibold tabular-nums text-tinta">
                                {membresia[campo.key as CampoEstadistica]}
                            </dd>
                        </div>
                    ))}
                </dl>

                {!membresia.availableForPlayoffs && (
                    <Insignia tono="peligro" className="self-start">
                        No disponible para playoffs
                    </Insignia>
                )}
            </div>
        </li>
    );
}
