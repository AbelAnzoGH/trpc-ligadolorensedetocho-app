'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { etiquetaCategoria } from '@/lib/team-ui';
import LogoEquipo from '@/components/logo-equipo';
import Boton from '@/components/ui/boton';
import { Nota } from '@/components/ui/estado';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseAccionesFila } from '@/components/ui/lista';
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
        // Cada inscripción es un elemento dentro del bloque 3: fondo canvas
        // (hundido) con borde fino, como las membresías en /manejar-jugadores.
        <li className="space-y-3 rounded-item border border-borde bg-canvas p-4">
            {/* ---------- Encabezado ---------- */}
            <div className="flex flex-wrap items-center justify-between gap-3">
                <span className="flex min-w-0 items-center gap-3">
                    <LogoEquipo nombre={inscripcion.team.name} logoUrl={inscripcion.team.logoUrl} tamano={40} />
                    <span className="min-w-0">
                        <span className="block truncate font-semibold text-tinta">{inscripcion.team.name}</span>
                        <span className="text-meta text-tenue">
                            {etiquetaCategoria[inscripcion.category]} · {inscripcion._count.memberships}{' '}
                            {inscripcion._count.memberships === 1 ? 'jugador' : 'jugadores'}
                        </span>
                    </span>
                </span>

                <span className={claseAccionesFila}>
                    <Boton variante="fantasma" tamano="sm" onClick={() => setEditando((v) => !v)} aria-expanded={editando}>
                        {editando ? 'Cerrar' : 'Estadísticas'}
                    </Boton>
                    {vacia && !cerrada && (
                        <Boton variante="secundario" tamano="sm" onClick={abrirCopiar} disabled={guardando || copiando}>
                            Copiar plantilla
                        </Boton>
                    )}
                    {vacia && (
                        <Boton variante="peligro" tamano="sm" onClick={onDarDeBaja} disabled={guardando}>
                            Dar de baja
                        </Boton>
                    )}
                </span>
            </div>

            {/* ---------- Resumen de estadísticas ---------- */}
            {!editando && (
                <p className="text-leyenda tabular-nums text-tenue">
                    {camposEquipo.map((c) => (
                        <span key={c.key} title={c.titulo} className="mr-3 inline-block">
                            {c.label} <span className="font-semibold text-tinta-2">{inscripcion[c.key]}</span>
                        </span>
                    ))}
                </p>
            )}

            {/* ---------- Edición de estadísticas ---------- */}
            {editando && (
                <form onSubmit={onGuardarStats} className="space-y-4">
                    <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
                        {camposEquipo.map((c) => (
                            <div key={c.key} className="flex flex-col gap-1.5">
                                <label
                                    htmlFor={`${inscripcion.id}-${c.key}`}
                                    title={c.titulo}
                                    className="truncate text-leyenda text-tenue"
                                >
                                    {c.titulo}
                                </label>
                                <input
                                    id={`${inscripcion.id}-${c.key}`}
                                    type="number"
                                    min={0}
                                    value={stats[c.key]}
                                    onChange={(e) => setStats({ ...stats, [c.key]: Number(e.target.value) })}
                                    className={`${claseCampo} w-full tabular-nums`}
                                />
                            </div>
                        ))}
                    </div>
                    <Boton type="submit" tamano="sm" disabled={guardando}>
                        {guardando ? 'Guardando…' : 'Guardar estadísticas'}
                    </Boton>
                </form>
            )}

            {/* ---------- Copiar plantilla ---------- */}
            {/* Subformulario abierto: borde fuerte (design.md). */}
            {copiando && (
                <form onSubmit={onCopiar} className="space-y-4 rounded-item border border-borde-fuerte p-4">
                    <p className="text-meta text-tinta-2">
                        Se copian las <strong className="font-semibold text-tinta">personas</strong>, su número y
                        sus posiciones. Las estadísticas llegan en cero y sin foto:{' '}
                        <em>se copia quién es, nunca cómo le fue</em>.
                    </p>
                    {origenes.length === 0 ? (
                        <Nota>
                            {inscripcion.team.name} no tiene otra inscripción con jugadores de la cual copiar.
                        </Nota>
                    ) : (
                        <div className="flex flex-wrap items-end gap-3">
                            <div className={claseGrupoCampo}>
                                <label htmlFor={`${inscripcion.id}-origen`} className={claseEtiqueta}>
                                    Copiar desde
                                </label>
                                <select
                                    id={`${inscripcion.id}-origen`}
                                    value={origenId}
                                    onChange={(e) => setOrigenId(e.target.value)}
                                    className={`${claseCampo} min-w-56`}
                                >
                                    {origenes.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {nombreTemporada(o.season.league, o.season.number)} ·{' '}
                                            {etiquetaCategoria[o.category]} ({o._count.memberships} jugadores)
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <Boton type="submit" disabled={guardando}>
                                {guardando ? 'Copiando…' : 'Copiar'}
                            </Boton>
                        </div>
                    )}
                    <Boton variante="secundario" tamano="sm" onClick={() => setCopiando(false)}>
                        Cancelar
                    </Boton>
                </form>
            )}
        </li>
    );
}
