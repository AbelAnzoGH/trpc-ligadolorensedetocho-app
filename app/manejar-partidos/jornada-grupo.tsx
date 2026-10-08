'use client';

import { useId, type ReactNode } from 'react';
import { cn } from '@/lib/cn';
import { formatoDiaPartido } from '@/lib/game-ui';

/**
 * Una JORNADA del rol de /manejar-partidos como panel colapsable.
 *
 * El encabezado es un solo botón con el resumen ("12 partidos · 9 con
 * resultado"), así que se ve de un vistazo qué jornadas tienen marcadores
 * pendientes sin abrirlas. Si todos los partidos caen el mismo día, el día se
 * dice una vez aquí y las filas muestran solo la hora.
 *
 * Es CONTROLADO: quien lo usa decide cuáles están abiertas (`abierto`) y
 * recibe el clic (`onAlternar`). Así el padre puede conservarlas abiertas
 * cuando recarga el rol después de capturar un marcador, y ofrecer
 * "Abrir todas / Cerrar todas".
 *
 * Accesibilidad: el botón lleva aria-expanded y aria-controls; el contenido
 * cerrado ni siquiera se monta.
 */
export default function JornadaGrupo({
    titulo,
    diaComun,
    total,
    conResultado,
    abierto,
    onAlternar,
    children,
}: {
    titulo: string;
    /** Fecha de la jornada si todos sus partidos caen el mismo día; si no, null. */
    diaComun: string | null;
    total: number;
    /** Cuántos de los `total` ya están finalizados. */
    conResultado: number;
    abierto: boolean;
    onAlternar: () => void;
    children: ReactNode;
}) {
    const idContenido = useId();

    return (
        <section className="rounded-item border border-borde bg-superficie">
            <h3>
                <button
                    type="button"
                    onClick={onAlternar}
                    aria-expanded={abierto}
                    aria-controls={idContenido}
                    className="flex w-full items-center justify-between gap-3 rounded-item px-4 py-3 text-left transition-colors hover:bg-superficie-2"
                >
                    <span className="min-w-0">
                        <span className="text-cuerpo font-semibold text-tinta-2">{titulo}</span>
                        {diaComun && (
                            <span className="text-cuerpo font-normal text-tenue"> · {formatoDiaPartido(diaComun)}</span>
                        )}
                    </span>

                    <span className="flex shrink-0 items-center gap-3 text-meta text-tenue">
                        <span className="tabular-nums">
                            {total} {total === 1 ? 'partido' : 'partidos'} · {conResultado} con resultado
                        </span>
                        <svg
                            aria-hidden
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth={2}
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            className={cn('size-4 transition-transform motion-reduce:transition-none', abierto && 'rotate-180')}
                        >
                            <path d="M6 9l6 6 6-6" />
                        </svg>
                    </span>
                </button>
            </h3>

            {abierto && (
                <div id={idContenido} className="space-y-6 border-t border-borde p-4">
                    {children}
                </div>
            )}
        </section>
    );
}
