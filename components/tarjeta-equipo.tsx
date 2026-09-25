import LogoEquipo from '@/components/logo-equipo';
import Insignia from '@/components/ui/insignia';
import { claseTarjeta } from '@/components/ui/tarjeta';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TeamSeason } from '@/lib/season-ui';

/**
 * Tarjeta de UN equipo inscrito, clicable (abre su plantel).
 * La usan /equipos y la página pública de cada temporada, para que un
 * equipo se vea igual en las dos (design.md → Rejilla de equipos).
 *
 * Es un <button> real: se enfoca con Tab y se abre con Enter o Espacio.
 * No lleva 'use client': el onClick lo pone quien la usa, que ya es cliente.
 */
export default function TarjetaEquipo({
    inscripcion,
    onAbrir,
    mostrarCategoria = true,
}: {
    inscripcion: TeamSeason;
    onAbrir: () => void;
    /** false cuando la categoría ya se dijo en el título del grupo. */
    mostrarCategoria?: boolean;
}) {
    const jugadores = inscripcion._count.memberships;

    return (
        <button
            type="button"
            onClick={onAbrir}
            aria-label={`Ver jugadores de ${inscripcion.team.name}`}
            className={claseTarjeta({
                variante: 'panel',
                interactiva: true,
                className: 'flex w-full items-center gap-4 text-left sm:p-5',
            })}
        >
            <LogoEquipo nombre={inscripcion.team.name} logoUrl={inscripcion.team.logoUrl} tamano={56} />
            <span className="min-w-0 flex-1 space-y-1.5">
                <span className="block truncate text-cuerpo-lg font-semibold text-tinta">{inscripcion.team.name}</span>
                <span className="flex flex-wrap items-center gap-2 text-meta text-tenue">
                    {mostrarCategoria && <Insignia>{etiquetaCategoria[inscripcion.category]}</Insignia>}
                    <span>
                        {jugadores} {jugadores === 1 ? 'jugador' : 'jugadores'}
                    </span>
                </span>
            </span>
        </button>
    );
}
