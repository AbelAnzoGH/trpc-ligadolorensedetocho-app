'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { etiquetaCategoria } from '@/lib/team-ui';
import LogoEquipo from '@/components/logo-equipo';
import PlantelModal from '@/components/plantel-modal';
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

/**
 * Una inscripción dentro del panel de temporadas. Tres acciones:
 *   - Abrir su plantel (registrar jugadores)
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
    // Modal de plantel (el atajo para registrar jugadores de este equipo).
    const [plantelAbierto, setPlantelAbierto] = useState(false);

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
                    <Boton variante="fantasma" tamano="sm" onClick={() => setPlantelAbierto(true)}>
                        Plantel
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

            {/* Se monta solo abierto: cada apertura empieza limpia. onCambio
                recarga la lista de inscripciones (su conteo de jugadores). */}
            {plantelAbierto && (
                <PlantelModal
                    equipo={inscripcion.team}
                    inscripcionId={inscripcion.id}
                    onCerrar={() => setPlantelAbierto(false)}
                    onCambio={onCambio}
                />
            )}
        </li>
    );
}
