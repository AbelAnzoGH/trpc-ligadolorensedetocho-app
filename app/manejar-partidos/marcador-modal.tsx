'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/modal';
import { trpcMutation } from '@/utils/trpc-fetch';
import { etiquetaCategoria } from '@/lib/team-ui';
import { cn } from '@/lib/cn';
import Boton from '@/components/ui/boton';
import { useConfirmar } from '@/components/use-confirmar';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
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
    const { confirmar, modalConfirmar } = useConfirmar();

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

    // Cambiar el marcador de un partido que YA se jugó es una corrección: se
    // pide confirmación mostrando el antes y el después. Con uno sin jugar no
    // hay nada que perder y no se pregunta.
    const confirmarCambio = (nuevoLocal: number, nuevoVisitante: number, textoConfirmar: string) =>
        confirmar({
            titulo: 'Corregir marcador',
            mensaje: (
                <>
                    ¿Estás seguro de que quieres cambiar el marcador de{' '}
                    <strong className="text-tinta">{nombreLocal} vs {nombreVisitante}</strong>? Pasa de{' '}
                    <strong className="text-tinta tabular-nums">{partido.homeScore} – {partido.awayScore}</strong> a{' '}
                    <strong className="text-tinta tabular-nums">{nuevoLocal} – {nuevoVisitante}</strong>.
                </>
            ),
            textoConfirmar,
            aviso: 'La tabla de posiciones se recalcula con el nuevo marcador.',
        });

    const onGuardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (local === '' || visitante === '') {
            toast.error('Captura los dos marcadores');
            return;
        }
        if (finalizado) {
            // Mismo marcador y no era default: no hay nada que corregir.
            if (!partido.isForfeit && Number(local) === partido.homeScore && Number(visitante) === partido.awayScore) {
                toast('El marcador no cambió');
                return;
            }
            if (!(await confirmarCambio(Number(local), Number(visitante), 'Corregir'))) return;
        }
        await ejecutar(
            () =>
                trpcMutation('recordResult', {
                    id: partido.id,
                    homeScore: Number(local),
                    awayScore: Number(visitante),
                }),
            finalizado ? 'Marcador corregido' : 'Resultado guardado',
        );
    };

    const onDefault = async (absentTeamSeasonId: string, ausente: string) => {
        if (finalizado) {
            // El default pisa el marcador existente: 0 para el ausente, 36 para el otro.
            const faltaLocal = absentTeamSeasonId === partido.homeTeamSeason.id;
            const ok = await confirmarCambio(faltaLocal ? 0 : PUNTOS_DEFAULT, faltaLocal ? PUNTOS_DEFAULT : 0, 'Cambiar a default');
            if (!ok) return;
        }
        await ejecutar(
            () => trpcMutation('recordForfeit', { id: partido.id, absentTeamSeasonId }),
            `Default: ${ausente} no se presentó`,
        );
    };

    const onDeshacer = async () => {
        const ok = await confirmar({
            titulo: 'Deshacer resultado',
            mensaje: '¿Estás seguro de que quieres deshacer el resultado? El partido vuelve a programado y deja de contar en la tabla de posiciones.',
            textoConfirmar: 'Deshacer',
            aviso: 'El marcador se borra: para que vuelva a contar habrá que capturarlo otra vez.',
        });
        if (!ok) return;
        await ejecutar(
            () => trpcMutation('undoResult', { id: partido.id }),
            'Resultado deshecho: el partido vuelve a programado',
        );
    };

    // Campo del marcador: grande y centrado, se lee de un vistazo. Con cn()
    // porque cambia el alto, el relleno y el tamaño de letra de claseCampo.
    const campoMarcador = cn(claseCampo, 'h-14 w-full py-0 text-center text-titulo-sm font-bold tabular-nums');

    return (
        <Modal
            abierto
            onCerrar={onCerrar}
            titulo={`${nombreLocal} vs ${nombreVisitante}`}
            subtitulo={`${etiquetaCategoria[partido.homeTeamSeason.category]} · ${formatoFechaPartido(partido.scheduledAt)}`}
        >
            <div className="space-y-6">
                {/* ---------- Marcador ---------- */}
                <form onSubmit={onGuardar} className="space-y-4">
                    <h3 className="text-cuerpo font-semibold text-tinta">Marcador</h3>
                    {partido.isForfeit && (
                        <p className="text-meta text-aviso">
                            Este partido está como default. Guardar un marcador lo convierte en partido jugado.
                        </p>
                    )}
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
                        <div className={cn(claseGrupoCampo, 'min-w-0')}>
                            <label htmlFor="m-local" className={cn(claseEtiqueta, 'truncate')}>{nombreLocal}</label>
                            <input
                                id="m-local"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={local}
                                onChange={(e) => setLocal(e.target.value)}
                                className={campoMarcador}
                            />
                        </div>
                        <span className="pb-4 text-apagado">–</span>
                        <div className={cn(claseGrupoCampo, 'min-w-0')}>
                            <label htmlFor="m-visitante" className={cn(claseEtiqueta, 'truncate')}>{nombreVisitante}</label>
                            <input
                                id="m-visitante"
                                type="number"
                                min={0}
                                inputMode="numeric"
                                value={visitante}
                                onChange={(e) => setVisitante(e.target.value)}
                                className={campoMarcador}
                            />
                        </div>
                    </div>
                    <Boton type="submit" anchoCompleto disabled={guardando}>
                        {finalizado ? 'Corregir marcador' : 'Guardar resultado'}
                    </Boton>
                </form>

                {/* ---------- Default ---------- */}
                <div className="space-y-3 border-t border-borde pt-5">
                    <h3 className="text-cuerpo font-semibold text-tinta">Ganado por default</h3>
                    <p className="text-meta text-tenue">
                        El equipo que no se presentó pierde 0 a {PUNTOS_DEFAULT}. Si no llegó ninguno, cierra
                        esta ventana y suspende el partido para reprogramarlo.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        <Boton
                            variante="secundario"
                            disabled={guardando}
                            onClick={() => onDefault(partido.homeTeamSeason.id, nombreLocal)}
                        >
                            No llegó {nombreLocal}
                        </Boton>
                        <Boton
                            variante="secundario"
                            disabled={guardando}
                            onClick={() => onDefault(partido.awayTeamSeason.id, nombreVisitante)}
                        >
                            No llegó {nombreVisitante}
                        </Boton>
                    </div>
                </div>

                {/* ---------- Deshacer ---------- */}
                {finalizado && (
                    <div className="space-y-3 border-t border-borde pt-5">
                        <h3 className="text-cuerpo font-semibold text-tinta">¿Resultado capturado por error?</h3>
                        <p className="text-meta text-tenue">
                            Regresa el partido a &quot;programado&quot; y borra el marcador. Después ya puedes
                            reprogramarlo, editarlo o borrarlo.
                        </p>
                        <Boton variante="peligro" disabled={guardando} onClick={onDeshacer}>
                            Deshacer resultado
                        </Boton>
                    </div>
                )}
            </div>
            {/* Confirmación de lo destructivo (components/use-confirmar.tsx). */}
            {modalConfirmar}
        </Modal>
    );
}
