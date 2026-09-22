'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { etiquetaCategoria, inputClass } from '@/lib/team-ui';
import {
    nombreTemporada,
    type TeamSeason,
    type ListTeamSeasonsResponse,
    type CopyRosterResponse,
} from '@/lib/season-ui';

// Las estadísticas del EQUIPO en esta inscripción. Se capturan a mano hasta
// que exista el sprint de partidos. Mismo truco que camposEstadistica de
// player-ui.ts: recorrer un arreglo en vez de escribir seis inputs a mano.
const camposEquipo = [
    { key: 'gamesPlayed', label: 'PJ', titulo: 'Partidos jugados' },
    { key: 'wins', label: 'G', titulo: 'Ganados' },
    { key: 'losses', label: 'P', titulo: 'Perdidos' },
    { key: 'ties', label: 'E', titulo: 'Empates' },
    { key: 'pointsFor', label: 'PF', titulo: 'Puntos a favor' },
    { key: 'pointsAgainst', label: 'PC', titulo: 'Puntos en contra' },
] as const;

type CampoEquipo = (typeof camposEquipo)[number]['key'];

/**
 * Una inscripción dentro del panel de temporadas. Tres acciones:
 *   - Capturar las estadísticas del equipo en esta temporada
 *   - Copiar la plantilla de otra inscripción del MISMO equipo (solo si está vacía)
 *   - Dar de baja la inscripción (solo si está vacía)
 */
export default function InscripcionFila({
    inscripcion,
    cerrada,
    onCambio,
}: {
    inscripcion: TeamSeason;
    /** La temporada está cerrada: no se copian plantillas. */
    cerrada: boolean;
    onCambio: () => Promise<void>;
}) {
    const [guardando, setGuardando] = useState(false);

    // --- estadísticas ---
    const [editando, setEditando] = useState(false);
    const [stats, setStats] = useState<Record<CampoEquipo, number>>(() => ({
        gamesPlayed: inscripcion.gamesPlayed,
        wins: inscripcion.wins,
        losses: inscripcion.losses,
        ties: inscripcion.ties,
        pointsFor: inscripcion.pointsFor,
        pointsAgainst: inscripcion.pointsAgainst,
    }));

    // --- copiar plantilla ---
    const [copiando, setCopiando] = useState(false);
    const [origenes, setOrigenes] = useState<TeamSeason[]>([]);
    const [origenId, setOrigenId] = useState('');

    const vacia = inscripcion._count.memberships === 0;

    const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
        setGuardando(true);
        try {
            await accion();
            toast.success(exito);
            await onCambio();
            return true;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
            return false;
        } finally {
            setGuardando(false);
        }
    };

    const onGuardarStats = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await ejecutar(
            () => trpcMutation('updateTeamSeason', { id: inscripcion.id, ...stats }),
            'Estadísticas guardadas',
        );
        if (ok) setEditando(false);
    };

    // Busca las OTRAS inscripciones de este equipo que tengan jugadores: son
    // las únicas de las que tiene sentido copiar. La más reciente queda
    // preseleccionada porque casi siempre es "la del año pasado".
    const abrirCopiar = async () => {
        setCopiando(true);
        try {
            const resp = await trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', {
                teamId: inscripcion.team.id,
            });
            const candidatas = resp.data.teamSeasons.filter(
                (ts) => ts.id !== inscripcion.id && ts._count.memberships > 0,
            );
            setOrigenes(candidatas);
            setOrigenId(candidatas[0]?.id ?? '');
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
            setCopiando(false);
        }
    };

    const onCopiar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!origenId) return;
        setGuardando(true);
        try {
            const resp = await trpcMutation<CopyRosterResponse>('copyRoster', {
                fromTeamSeasonId: origenId,
                toTeamSeasonId: inscripcion.id,
            });
            toast.success(
                `${resp.data.copiados} jugadores copiados, sin estadísticas ni foto. Quita a los que se fueron desde Manejar jugadores.`,
            );
            setCopiando(false);
            await onCambio();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const onDarDeBaja = () =>
        ejecutar(
            () => trpcMutation('removeTeamSeason', { id: inscripcion.id }),
            `${inscripcion.team.name} dado de baja de esta temporada`,
        );

    return (
        <li className="space-y-3 rounded-lg border border-gray-800 bg-gray-950/40 p-4">
            {/* ---------- Encabezado ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-950/60">
                        {inscripcion.team.logoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={inscripcion.team.logoUrl} alt="" className="h-full w-full object-contain" />
                        ) : (
                            <span className="text-[9px] uppercase text-gray-600">s/l</span>
                        )}
                    </span>
                    <span className="min-w-0">
                        <strong className="block truncate text-white">{inscripcion.team.name}</strong>
                        <span className="text-sm text-gray-400">
                            {etiquetaCategoria[inscripcion.category]} · {inscripcion._count.memberships}{' '}
                            {inscripcion._count.memberships === 1 ? 'jugador' : 'jugadores'}
                        </span>
                    </span>
                </span>

                <span className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => setEditando((v) => !v)}
                        className="rounded-full border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:text-white"
                    >
                        {editando ? 'Cerrar' : 'Estadísticas'}
                    </button>
                    {vacia && !cerrada && (
                        <button
                            type="button"
                            onClick={abrirCopiar}
                            disabled={guardando || copiando}
                            className="rounded-full border border-pink-500/60 px-3 py-1 text-sm text-pink-400 hover:text-pink-300 disabled:opacity-50"
                        >
                            Copiar plantilla
                        </button>
                    )}
                    {vacia && (
                        <button
                            type="button"
                            onClick={onDarDeBaja}
                            disabled={guardando}
                            className="rounded-full border border-red-500/60 px-3 py-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                            Dar de baja
                        </button>
                    )}
                </span>
            </div>

            {/* ---------- Resumen de estadísticas ---------- */}
            {!editando && (
                <p className="text-xs text-gray-500">
                    {camposEquipo.map((c) => `${c.label} ${inscripcion[c.key]}`).join(' · ')}
                </p>
            )}

            {/* ---------- Edición de estadísticas ---------- */}
            {editando && (
                <form onSubmit={onGuardarStats} className="space-y-3">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {camposEquipo.map((c) => (
                            <div key={c.key} className="flex flex-col gap-1">
                                <label
                                    htmlFor={`${inscripcion.id}-${c.key}`}
                                    title={c.titulo}
                                    className="text-xs text-gray-500"
                                >
                                    {c.titulo}
                                </label>
                                <input
                                    id={`${inscripcion.id}-${c.key}`}
                                    type="number"
                                    min={0}
                                    value={stats[c.key]}
                                    onChange={(e) => setStats({ ...stats, [c.key]: Number(e.target.value) })}
                                    className={inputClass}
                                />
                            </div>
                        ))}
                    </div>
                    <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                    >
                        {guardando ? 'Guardando...' : 'Guardar estadísticas'}
                    </button>
                </form>
            )}

            {/* ---------- Copiar plantilla ---------- */}
            {copiando && (
                <form onSubmit={onCopiar} className="space-y-3 rounded-md border border-pink-500/30 p-3">
                    <p className="text-sm text-gray-300">
                        Se copian las <strong>personas</strong>, su número y sus posiciones. Las
                        estadísticas llegan en cero y sin foto: <em>se copia quién es, nunca cómo le fue</em>.
                    </p>
                    {origenes.length === 0 ? (
                        <p className="text-sm text-gray-400">
                            {inscripcion.team.name} no tiene otra inscripción con jugadores de la cual copiar.
                        </p>
                    ) : (
                        <div className="flex flex-wrap items-end gap-3">
                            <div className="flex flex-col gap-1">
                                <label htmlFor={`${inscripcion.id}-origen`} className="text-sm text-gray-300">
                                    Copiar desde
                                </label>
                                <select
                                    id={`${inscripcion.id}-origen`}
                                    value={origenId}
                                    onChange={(e) => setOrigenId(e.target.value)}
                                    className={inputClass}
                                >
                                    {origenes.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {nombreTemporada(o.season.league, o.season.number)} ·{' '}
                                            {etiquetaCategoria[o.category]} ({o._count.memberships} jugadores)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <button
                                type="submit"
                                disabled={guardando}
                                className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                            >
                                {guardando ? 'Copiando...' : 'Copiar'}
                            </button>
                        </div>
                    )}
                    <button
                        type="button"
                        onClick={() => setCopiando(false)}
                        className="text-sm text-gray-400 hover:text-white"
                    >
                        Cancelar
                    </button>
                </form>
            )}
        </li>
    );
}
