import type { ReactNode } from 'react';
import { etiquetaCategoria } from '@/lib/team-ui';
import {
    etiquetaEstadoPartido,
    claseEstadoPartido,
    formatoFechaPartido,
    formatoHoraPartido,
    type Game,
    type LadoPartido,
} from '@/lib/game-ui';

/**
 * Cómo se ve UN partido, en cualquier parte del sitio: la página pública de
 * la temporada y el rol de /manejar-partidos. Solo pinta; no sabe de
 * acciones. Quien la usa puede meter botones como `children` (el admin lo
 * hace; la página pública no).
 *
 * No lleva 'use client': no tiene estado ni eventos, así que funciona dentro
 * de un componente de cliente o de uno de servidor.
 */
export default function PartidoTarjeta({
    partido: p,
    soloHora = false,
    children,
}: {
    partido: Game;
    /** true si el día ya se dijo en el encabezado de la jornada. */
    soloHora?: boolean;
    /** Acciones opcionales debajo del partido. */
    children?: ReactNode;
}) {
    const finalizado = p.status === 'finalizado';

    return (
        <li className="space-y-2 rounded-lg border border-gray-800 bg-gray-950/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span className="text-gray-300">
                    {soloHora ? formatoHoraPartido(p.scheduledAt) : formatoFechaPartido(p.scheduledAt)}
                </span>
                <span>· {p.venue.name}{p.field != null ? `, campo ${p.field}` : ''}</span>
                <span className="rounded-full border border-gray-700 px-2 py-0.5">
                    {etiquetaCategoria[p.homeTeamSeason.category]}
                </span>
                <span className={`rounded-full border px-2 py-0.5 ${claseEstadoPartido[p.status]}`}>
                    {etiquetaEstadoPartido[p.status]}
                </span>
                {p.isForfeit && (
                    <span className="rounded-full border border-yellow-500/40 px-2 py-0.5 text-yellow-300">Default</span>
                )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Lado lado={p.homeTeamSeason} alineacion="derecha" />
                <span className="min-w-16 text-center text-lg font-bold text-white">
                    {finalizado ? `${p.homeScore} – ${p.awayScore}` : <span className="text-sm text-gray-500">vs</span>}
                </span>
                <Lado lado={p.awayTeamSeason} alineacion="izquierda" />
            </div>

            {p.notes && <p className="text-sm text-gray-400">{p.notes}</p>}

            {children}
        </li>
    );
}

/** Logo + nombre de un equipo. El local se alinea hacia el marcador (derecha). */
function Lado({ lado, alineacion }: { lado: LadoPartido; alineacion: 'derecha' | 'izquierda' }) {
    const logo = (
        <span className="flex h-8 w-8 shrink-0 items-center justify-center overflow-hidden rounded border border-gray-800 bg-gray-950/60">
            {lado.team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lado.team.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
                <span className="text-[8px] uppercase text-gray-600">s/l</span>
            )}
        </span>
    );
    const nombre = <span className="min-w-0 truncate font-semibold text-white">{lado.team.name}</span>;

    return (
        <span className={`flex min-w-0 items-center gap-2 ${alineacion === 'derecha' ? 'justify-end' : ''}`}>
            {alineacion === 'derecha' ? (
                <>
                    {nombre}
                    {logo}
                </>
            ) : (
                <>
                    {logo}
                    {nombre}
                </>
            )}
        </span>
    );
}
