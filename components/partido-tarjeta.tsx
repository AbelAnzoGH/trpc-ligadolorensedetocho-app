import type { ReactNode } from 'react';
import Insignia from '@/components/ui/insignia';
import { cn } from '@/lib/cn';
import { etiquetaCategoria } from '@/lib/team-ui';
import {
    etiquetaEstadoPartido,
    tonoEstadoPartido,
    tonoDefault,
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
 *
 * Diseño (design.md → Patrones → Tarjeta de partido): elemento `rounded-item`
 * con borde fino; metadatos en `tenue` con insignias; marcador en números
 * tabulares; en un partido jugado, el perdedor se atenúa (`tenue`).
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
    // Solo en un partido jugado hay perdedor; en un empate, nadie.
    const pierdeLocal = finalizado && p.homeScore! < p.awayScore!;
    const pierdeVisitante = finalizado && p.awayScore! < p.homeScore!;

    return (
        <li className="space-y-3 rounded-item border border-borde bg-superficie px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-meta text-tenue">
                <span className="font-medium text-tinta-2">
                    {soloHora ? formatoHoraPartido(p.scheduledAt) : formatoFechaPartido(p.scheduledAt)}
                </span>
                <span>· {p.venue.name}{p.field != null ? `, campo ${p.field}` : ''}</span>
                <Insignia>{etiquetaCategoria[p.homeTeamSeason.category]}</Insignia>
                <Insignia tono={tonoEstadoPartido[p.status]}>{etiquetaEstadoPartido[p.status]}</Insignia>
                {p.isForfeit && <Insignia tono={tonoDefault}>Default</Insignia>}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <Lado lado={p.homeTeamSeason} alineacion="derecha" atenuado={pierdeLocal} />
                <span className="min-w-16 text-center">
                    {finalizado ? (
                        <span className="text-subtitulo font-bold tabular-nums text-tinta">
                            {p.homeScore} – {p.awayScore}
                        </span>
                    ) : (
                        <span className="text-leyenda font-medium uppercase tracking-wider text-apagado">vs</span>
                    )}
                </span>
                <Lado lado={p.awayTeamSeason} alineacion="izquierda" atenuado={pierdeVisitante} />
            </div>

            {p.notes && <p className="text-meta text-tenue">{p.notes}</p>}

            {children}
        </li>
    );
}

/** Logo + nombre de un equipo. El local se alinea hacia el marcador (derecha). */
function Lado({
    lado,
    alineacion,
    atenuado,
}: {
    lado: LadoPartido;
    alineacion: 'derecha' | 'izquierda';
    /** true si este equipo perdió: su nombre va en tenue. */
    atenuado: boolean;
}) {
    const logo = (
        <span className="flex size-8 shrink-0 items-center justify-center overflow-hidden rounded-insignia border border-borde bg-canvas">
            {lado.team.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={lado.team.logoUrl} alt="" className="h-full w-full object-contain" />
            ) : (
                <span className="text-[8px] uppercase text-apagado">s/l</span>
            )}
        </span>
    );
    const nombre = (
        <span className={cn('min-w-0 truncate font-semibold', atenuado ? 'text-tenue' : 'text-tinta')}>
            {lado.team.name}
        </span>
    );

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
