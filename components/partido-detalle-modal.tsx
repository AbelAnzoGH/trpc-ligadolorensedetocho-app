'use client';

import Modal from '@/components/modal';
import LogoEquipo from '@/components/logo-equipo';
import Insignia from '@/components/ui/insignia';
import { etiquetaCategoria } from '@/lib/team-ui';
import { PUNTOS_DEFAULT } from '@/lib/game-schema';
import {
    etiquetaFase,
    etiquetaEstadoPartido,
    tonoEstadoPartido,
    formatoDiaPartido,
    formatoHoraPartido,
    type Game,
} from '@/lib/game-ui';

/**
 * Todos los detalles de UN partido, en la ventana emergente del sitio.
 * Lo abre el rol público al hacer clic en un PartidoCompacto.
 * Solo lectura: los datos ya vienen en el partido, no se pide nada al servidor.
 */
export default function PartidoDetalleModal({
    partido: p,
    onCerrar,
}: {
    /** El partido abierto, o null si el modal está cerrado. */
    partido: Game | null;
    onCerrar: () => void;
}) {
    if (!p) return null;

    const local = p.homeTeamSeason.team;
    const visitante = p.awayTeamSeason.team;
    const jugado = p.status === 'finalizado';

    // En un default, el que tiene 0 es el que no llegó.
    const ausente = p.isForfeit ? (p.homeScore === 0 ? local.name : visitante.name) : null;

    const filas: [string, string][] = [
        ['Fecha', formatoDiaPartido(p.scheduledAt)],
        ['Hora', formatoHoraPartido(p.scheduledAt)],
        ['Sede', p.venue.name],
    ];
    if (p.venue.address) filas.push(['Dirección', p.venue.address]);
    if (p.field != null) filas.push(['Campo', String(p.field)]);
    filas.push(['Categoría', etiquetaCategoria[p.homeTeamSeason.category]]);
    filas.push(['Fase', etiquetaFase[p.phase]]);
    if (p.round != null) filas.push(['Jornada', String(p.round)]);

    return (
        <Modal
            abierto
            onCerrar={onCerrar}
            titulo={`${local.name} vs ${visitante.name}`}
            subtitulo={p.round != null ? `Jornada ${p.round}` : etiquetaFase[p.phase]}
        >
            <div className="space-y-6">
                {/* ---------- Marcador ---------- */}
                <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                    <div className="flex flex-col items-center gap-2 text-center">
                        <LogoEquipo nombre={local.name} logoUrl={local.logoUrl} tamano={72} />
                        <span className="text-meta font-semibold text-tinta">{local.name}</span>
                        <span className="text-leyenda text-tenue">Local</span>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        {jugado ? (
                            <span className="text-titulo-sm font-bold tabular-nums text-tinta">
                                {p.homeScore} – {p.awayScore}
                            </span>
                        ) : (
                            <span className="text-meta font-medium uppercase tracking-wider text-apagado">vs</span>
                        )}
                        <Insignia tono={tonoEstadoPartido[p.status]}>{etiquetaEstadoPartido[p.status]}</Insignia>
                    </div>
                    <div className="flex flex-col items-center gap-2 text-center">
                        <LogoEquipo nombre={visitante.name} logoUrl={visitante.logoUrl} tamano={72} />
                        <span className="text-meta font-semibold text-tinta">{visitante.name}</span>
                        <span className="text-leyenda text-tenue">Visitante</span>
                    </div>
                </div>

                {/* Aviso en tono "aviso": mismo color que la insignia "Default". */}
                {ausente && (
                    <p className="rounded-item border border-aviso/30 bg-aviso/10 p-3 text-meta text-aviso">
                        Ganado por default: {ausente} no se presentó ({PUNTOS_DEFAULT}-0).
                    </p>
                )}

                {/* ---------- Detalles ---------- */}
                <dl className="divide-y divide-borde rounded-item border border-borde">
                    {filas.map(([etiqueta, valor]) => (
                        <div key={etiqueta} className="flex justify-between gap-4 px-4 py-2.5 text-meta">
                            <dt className="text-tenue">{etiqueta}</dt>
                            <dd className="text-right text-tinta first-letter:uppercase">{valor}</dd>
                        </div>
                    ))}
                </dl>

                {p.notes && (
                    <div className="space-y-1">
                        <h3 className="text-meta font-semibold text-tinta-2">Notas</h3>
                        <p className="text-meta text-tenue">{p.notes}</p>
                    </div>
                )}
            </div>
        </Modal>
    );
}
