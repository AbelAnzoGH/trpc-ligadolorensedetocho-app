import { etiquetaCategoria } from '@/lib/team-ui';
import { camposEstadistica, type MembershipConJugador, type CampoEstadistica } from '@/lib/player-ui';

/**
 * Una tarjeta del listado público. Es puramente presentacional: recibe una
 * membresía por props y la pinta, sin estado ni eventos propios. Por eso no
 * lleva 'use client' — hereda el entorno de quien la renderiza.
 *
 * La foto sale de la MEMBRESÍA, no de la persona: quien juega en varonil y
 * en mixto tiene una foto por uniforme. Si esa membresía todavía no tiene
 * foto, se muestran las iniciales sobre el degradado como respaldo, para que
 * la rejilla no quede con huecos.
 */
export default function JugadorTarjeta({ membresia }: { membresia: MembershipConJugador }) {
    const { player: jugador, team: equipo } = membresia;
    const iniciales = `${jugador.name[0] ?? ''}${jugador.lastName[0] ?? ''}`.toUpperCase();

    return (
        // `overflow-hidden` en el <li> es lo que hace que la foto respete las
        // esquinas redondeadas de la tarjeta. El padding ya no va aquí sino en
        // el bloque de texto, para que la imagen llegue de borde a borde.
        <li className="flex flex-col overflow-hidden rounded-lg border border-gray-800 bg-gray-900/40 transition hover:border-gray-700">
            {/* ---------- Foto ---------- */}
            {/*
              aspect-[4/3] fija la ALTURA a partir del ancho de la columna, así
              todas las tarjetas de la rejilla miden lo mismo aunque las fotos
              vengan en proporciones distintas. Con el resto del contenido, la
              imagen ocupa alrededor de la mitad de la tarjeta.

              object-cover recorta lo que sobra para llenar el marco sin
              deformar a nadie; object-contain dejaría barras vacías a los lados.
            */}
            <div className="relative aspect-[4/3] w-full shrink-0 bg-gray-950/60">
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
                        className="flex h-full w-full items-center justify-center bg-linear-to-br from-pink-500 to-yellow-500 text-5xl font-bold text-white"
                    >
                        {iniciales}
                    </div>
                )}

                {/* El número encima de la foto, en una esquina. El fondo
                    semitransparente con blur mantiene el número legible
                    tanto sobre una foto clara como sobre una oscura. */}
                <span className="absolute right-2 top-2 rounded-full bg-gray-950/70 px-2.5 py-0.5 font-mono text-sm font-bold text-pink-400 backdrop-blur-sm">
                    #{membresia.jerseyNumber}
                </span>
            </div>

            {/* ---------- Datos ---------- */}
            <div className="flex flex-1 flex-col gap-3 p-5">
                <div className="min-w-0">
                    <h2 className="truncate font-semibold text-white">
                        {jugador.name} {jugador.lastName}
                    </h2>
                    <p className="truncate text-sm text-gray-400">{equipo.name}</p>
                </div>

                <p className="text-xs uppercase tracking-wide text-gray-500">
                    {etiquetaCategoria[equipo.category]} · {jugador.age} años · {jugador.height} cm
                </p>

                <div className="flex flex-wrap gap-1.5">
                    {membresia.positions.map((posicion) => (
                        <span
                            key={posicion}
                            className="rounded-full border border-gray-700 px-2.5 py-0.5 text-xs font-semibold text-gray-300"
                        >
                            {posicion}
                        </span>
                    ))}
                </div>

                {/* mt-auto empuja las estadísticas al fondo de la tarjeta, para
                    que la línea divisoria quede alineada entre tarjetas aunque
                    una tenga más posiciones o un nombre más largo que otra. */}
                <dl className="mt-auto grid grid-cols-2 gap-x-3 gap-y-1 border-t border-gray-800 pt-3 text-xs">
                    {camposEstadistica.map((campo) => (
                        <div key={campo.key} className="flex justify-between gap-2">
                            <dt className="truncate text-gray-500">{campo.label}</dt>
                            <dd className="font-semibold text-gray-200">
                                {membresia[campo.key as CampoEstadistica]}
                            </dd>
                        </div>
                    ))}
                </dl>

                {!membresia.availableForPlayoffs && (
                    <p className="text-xs font-semibold text-red-400">
                        No disponible para playoffs
                    </p>
                )}
            </div>
        </li>
    );
}
