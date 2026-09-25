'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/modal';
import { trpcMutation } from '@/utils/trpc-fetch';
import { etiquetaCategoria, inputClass } from '@/lib/team-ui';
import { PUNTOS_DEFAULT } from '@/lib/game-schema';
import { formatoFechaPartido, type Game } from '@/lib/game-ui';

/**
 * Ventana para el RESULTADO de un partido. Tres acciones, tres endpoints:
 *   - Guardar marcador   → recordResult  (también corrige uno ya capturado)
 *   - "No llegó X"       → recordForfeit (36-0 a favor del que sí llegó)
 *   - Deshacer resultado → undoResult    (solo si ya está finalizado)
 *
 * El padre le pone `key={partido.id}` para que los campos arranquen con el
 * marcador de ESE partido cada vez que se abre.
 */
export default function MarcadorModal({
    partido,
    onCerrar,
    onCambio,
}: {
    /** El partido abierto, o null si el modal está cerrado. */
    partido: Game | null;
    onCerrar: () => void;
    /** Se llama después de cada cambio exitoso para recargar el rol. */
    onCambio: () => Promise<void>;
}) {
    const [local, setLocal] = useState(partido?.homeScore != null ? String(partido.homeScore) : '');
    const [visitante, setVisitante] = useState(partido?.awayScore != null ? String(partido.awayScore) : '');
    const [guardando, setGuardando] = useState(false);

    if (!partido) return null;

    const nombreLocal = partido.homeTeamSeason.team.name;
    const nombreVisitante = partido.awayTeamSeason.team.name;
    const finalizado = partido.status === 'finalizado';

    // Mismo patrón que los paneles: toast, recarga y cierra si salió bien.
    const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
        setGuardando(true);
        try {
            await accion();
            toast.success(exito);
            await onCambio();
            onCerrar();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const onGuardar = (e: React.FormEvent) => {
        e.preventDefault();
        if (local === '' || visitante === '') {
            toast.error('Captura los dos marcadores');
            return;
        }
        return ejecutar(
            () =>
                trpcMutation('recordResult', {
                    id: partido.id,
                    homeScore: Number(local),
                    awayScore: Number(visitante),
                }),
            finalizado ? 'Marcador corregido' : 'Resultado guardado',
        );
    };

    const onDefault = (absentTeamSeasonId: string, ausente: string) =>
        ejecutar(
            () => trpcMutation('recordForfeit', { id: partido.id, absentTeamSeasonId }),
            `Default: ${ausente} no se presentó`,
        );

    const onDeshacer = () =>
        ejecutar(() => trpcMutation('undoResult', { id: partido.id }), 'Resultado deshecho: el partido vuelve a programado');

    const botonSecundario =
        'rounded-full border px-4 py-2 text-sm transition disabled:opacity-50';

    return (
        <Modal
            abierto
            onCerrar={onCerrar}
            titulo={`${nombreLocal} vs ${nombreVisitante}`}
            subtitulo={`${etiquetaCategoria[partido.homeTeamSeason.category]} · ${formatoFechaPartido(partido.scheduledAt)}`}
        >
            <div className="space-y-6">
                {/* ---------- Marcador ---------- */}
                <form onSubmit={onGuardar} className="space-y-3">
                    <h3 className="font-semibold text-white">Marcador</h3>
                    {partido.isForfeit && (
                        <p className="text-sm text-yellow-300">
                            Este partido está como default. Guardar un marcador lo convierte en partido jugado.
                        </p>
                    )}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="m-local" className="truncate text-sm text-gray-300">{nombreLocal}</label>
                            <input
                                id="m-local"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={local}
                                onChange={(e) => setLocal(e.target.value)}
                                className={`${inputClass} text-center text-2xl font-bold`}
                            />
                        </div>
                        <span className="pb-3 text-gray-500">–</span>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="m-visitante" className="truncate text-sm text-gray-300">{nombreVisitante}</label>
                            <input
                                id="m-visitante"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={visitante}
                                onChange={(e) => setVisitante(e.target.value)}
                                className={`${inputClass} text-center text-2xl font-bold`}
                            />
                        </div>
                    </div>
                    <button
                        type="submit"
                        disabled={guardando}
                        className="w-full rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-5 py-2 font-semibold text-white transition duration-300 hover:bg-linear-to-l disabled:opacity-50"
                    >
                        {finalizado ? 'Corregir marcador' : 'Guardar resultado'}
                    </button>
                </form>

                {/* ---------- Default ---------- */}
                <div className="space-y-3 border-t border-gray-800 pt-4">
                    <h3 className="font-semibold text-white">Ganado por default</h3>
                    <p className="text-sm text-gray-400">
                        El equipo que no se presentó pierde 0 a {PUNTOS_DEFAULT}. Si no llegó ninguno, cierra
                        esta ventana y suspende el partido para reprogramarlo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <button
                            type="button"
                            disabled={guardando}
                            onClick={() => onDefault(partido.homeTeamSeason.id, nombreLocal)}
                            className={`${botonSecundario} border-yellow-500/60 text-yellow-300 hover:text-yellow-200`}
                        >
                            No llegó {nombreLocal}
                        </button>
                        <button
                            type="button"
                            disabled={guardando}
                            onClick={() => onDefault(partido.awayTeamSeason.id, nombreVisitante)}
                            className={`${botonSecundario} border-yellow-500/60 text-yellow-300 hover:text-yellow-200`}
                        >
                            No llegó {nombreVisitante}
                        </button>
                    </div>
                </div>

                {/* ---------- Deshacer ---------- */}
                {finalizado && (
                    <div className="space-y-3 border-t border-gray-800 pt-4">
                        <h3 className="font-semibold text-white">¿Resultado capturado por error?</h3>
                        <p className="text-sm text-gray-400">
                            Regresa el partido a &quot;programado&quot; y borra el marcador. Después ya puedes
                            reprogramarlo, editarlo o borrarlo.
                        </p>
                        <button
                            type="button"
                            disabled={guardando}
                            onClick={onDeshacer}
                            className={`${botonSecundario} border-red-500/60 text-red-400 hover:text-red-300`}
                        >
                            Deshacer resultado
                        </button>
                    </div>
                )}
            </div>
        </Modal>
    );
}
