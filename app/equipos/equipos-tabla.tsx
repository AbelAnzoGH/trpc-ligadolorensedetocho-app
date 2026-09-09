'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpcQuery } from '@/utils/trpc-fetch';
import { teamCategories, type TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria, inputClass, type Team, type ListTeamsResponse } from '@/lib/team-ui';
import EquipoRosterModal from './equipo-roster-modal';

/**
 * Tabla pública de equipos: SOLO lectura.
 * No importa trpcMutation a propósito — desde esta página no se puede
 * crear, editar ni borrar nada. Eso vive en /manejar-equipos.
 */
export default function EquiposTabla() {
    const [equipos, setEquipos] = useState<Team[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtro del listado ('' = todas las categorías)
    const [filtro, setFiltro] = useState<TeamCategory | ''>('');

    // Equipo cuyo plantel se está viendo. null = ningún modal abierto.
    // Se guarda el equipo COMPLETO y no solo su id, para que el modal pueda
    // pintar el nombre y la categoría en el encabezado sin volver a pedirlos.
    const [equipoAbierto, setEquipoAbierto] = useState<Team | null>(null);

    const cargarEquipos = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const data = await trpcQuery<ListTeamsResponse>(
                'listTeams',
                filtro ? { category: filtro } : undefined,
            );
            setEquipos(data.data.teams);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, [filtro]);

    useEffect(() => {
        cargarEquipos();
    }, [cargarEquipos]);

    return (
        <div className="space-y-6">
            {/* ---------- Filtro ---------- */}
            <div className="flex flex-wrap items-center gap-3">
                <label htmlFor="filtro" className="text-sm text-gray-300">
                    Filtrar por categoría:
                </label>
                <select
                    id="filtro"
                    value={filtro}
                    onChange={(e) => setFiltro(e.target.value as TeamCategory | '')}
                    className={inputClass}
                >
                    <option value="">Todas</option>
                    {teamCategories.map((c) => (
                        <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                    ))}
                </select>

                {!cargando && !error && (
                    <span className="text-sm text-gray-500">
                        {equipos.length} {equipos.length === 1 ? 'equipo' : 'equipos'}
                    </span>
                )}
            </div>

            {/* ---------- Tabla ---------- */}
            {!cargando && !error && equipos.length > 0 && (
                <p className="text-sm text-gray-500">
                    Haz clic en un equipo para ver su plantel.
                </p>
            )}

            {cargando && <p className="text-gray-300">Cargando equipos...</p>}
            {error && <p className="text-red-400">Error: {error}</p>}

            {!cargando && !error && equipos.length === 0 && (
                <p className="text-gray-400">Todavía no hay equipos registrados.</p>
            )}

            {!cargando && !error && equipos.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/70 text-sm uppercase tracking-wide text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-semibold">
                                    <span className="sr-only">Logo</span>
                                </th>
                                <th scope="col" className="px-4 py-3 font-semibold">Equipo</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {equipos.map((equipo) => (
                                <tr
                                    key={equipo.id}
                                    // Una fila de tabla no puede ser un <button>
                                    // (rompería el HTML), así que se le da el
                                    // papel de botón a mano: rol, foco con
                                    // Tab y respuesta a Enter / Espacio. Sin
                                    // esto la función solo existiría para quien
                                    // usa ratón.
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Ver jugadores de ${equipo.name}`}
                                    onClick={() => setEquipoAbierto(equipo)}
                                    onKeyDown={(evento) => {
                                        if (evento.key === 'Enter' || evento.key === ' ') {
                                            // Espacio, sin esto, haría scroll.
                                            evento.preventDefault();
                                            setEquipoAbierto(equipo);
                                        }
                                    }}
                                    className="cursor-pointer bg-gray-900/40 transition hover:bg-gray-800/60 focus:outline-none focus-visible:bg-gray-800/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500"
                                >
                                    <td className="py-3 pl-4 pr-0">
                                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-950/60">
                                            {equipo.logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={equipo.logoUrl}
                                                    alt=""
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-[9px] uppercase text-gray-600">
                                                    s/l
                                                </span>
                                            )}
                                        </span>
                                    </td>
                                    <td className="px-4 py-3 font-semibold text-white">
                                        {equipo.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {etiquetaCategoria[equipo.category]}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ---------- Ventana emergente con el plantel ---------- */}
            {/* Se monta siempre; es el propio modal el que decide no pintar
                nada mientras `equipo` sea null. Así el estado de carga se
                reinicia solo cada vez que se abre un equipo distinto. */}
            <EquipoRosterModal
                equipo={equipoAbierto}
                onCerrar={() => setEquipoAbierto(null)}
            />
        </div>
    );
}
