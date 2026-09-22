'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { trpcQuery } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import { teamCategories, type TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria, inputClass } from '@/lib/team-ui';
import {
    nombreTemporada,
    urlTemporada,
    type TeamSeason,
    type ListTeamSeasonsResponse,
} from '@/lib/season-ui';
import EquipoRosterModal from './equipo-roster-modal';

/**
 * Tabla pública de equipos: SOLO lectura.
 * No importa trpcMutation a propósito — desde esta página no se puede
 * crear, editar ni borrar nada. Eso vive en /manejar-equipos y /manejar-temporadas.
 *
 * Lo que se lista NO son equipos a secas sino INSCRIPCIONES: "Patito en
 * LDT VII, varonil". Por eso primero se elige liga y temporada, y el mismo
 * equipo puede salir dos veces si juega varonil y mixto.
 */
export default function EquiposTabla() {
    const { ligas, cargando: cargandoLigas, error: errorLigas, seasonId, setSeasonId, elegida } = useLigas();

    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtro del listado ('' = todas las categorías)
    const [filtro, setFiltro] = useState<TeamCategory | ''>('');

    // Inscripción cuyo plantel se está viendo. null = ningún modal abierto.
    // Se guarda COMPLETA y no solo su id, para que el modal pueda pintar el
    // nombre y la categoría en el encabezado sin volver a pedirlos.
    const [abierta, setAbierta] = useState<TeamSeason | null>(null);

    const cargarEquipos = useCallback(async () => {
        if (!seasonId) {
            setInscripciones([]);
            setCargando(false);
            return;
        }
        setCargando(true);
        setError(null);
        try {
            const data = await trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', {
                seasonId,
                category: filtro || undefined,
            });
            setInscripciones(data.data.teamSeasons);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, [seasonId, filtro]);

    useEffect(() => {
        cargarEquipos();
    }, [cargarEquipos]);

    if (cargandoLigas) return <p className="text-gray-300">Cargando temporadas...</p>;
    if (errorLigas) return <p className="text-red-400">Error: {errorLigas}</p>;

    return (
        <div className="space-y-6">
            {/* ---------- Temporada + filtro ---------- */}
            <div className="flex flex-wrap items-end gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-4">
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} />

                <div className="flex flex-col gap-1">
                    <label htmlFor="filtro" className="text-sm text-gray-300">
                        Categoría
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
                </div>
            </div>

            {elegida && (
                <p className="text-sm text-gray-500">
                    {!cargando && !error && (
                        <>
                            {inscripciones.length} {inscripciones.length === 1 ? 'equipo' : 'equipos'} en{' '}
                        </>
                    )}
                    <Link
                        href={urlTemporada(elegida.liga, elegida.temporada.number)}
                        className="font-semibold text-pink-400 hover:text-pink-300"
                    >
                        {nombreTemporada(elegida.liga, elegida.temporada.number)}
                    </Link>
                    {!cargando && !error && inscripciones.length > 0 && ' · Haz clic en un equipo para ver su plantel.'}
                </p>
            )}

            {/* ---------- Tabla ---------- */}
            {cargando && <p className="text-gray-300">Cargando equipos...</p>}
            {error && <p className="text-red-400">Error: {error}</p>}

            {!cargando && !error && inscripciones.length === 0 && (
                <p className="text-gray-400">
                    {seasonId
                        ? 'Todavía no hay equipos inscritos en esta temporada.'
                        : 'Todavía no hay temporadas registradas.'}
                </p>
            )}

            {!cargando && !error && inscripciones.length > 0 && (
                <div className="overflow-x-auto rounded-lg border border-gray-800">
                    <table className="w-full text-left">
                        <thead className="bg-gray-900/70 text-sm uppercase tracking-wide text-gray-400">
                            <tr>
                                <th scope="col" className="px-4 py-3 font-semibold">
                                    <span className="sr-only">Logo</span>
                                </th>
                                <th scope="col" className="px-4 py-3 font-semibold">Equipo</th>
                                <th scope="col" className="px-4 py-3 font-semibold">Categoría</th>
                                <th scope="col" className="hidden px-4 py-3 text-right font-semibold sm:table-cell">Jugadores</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-800">
                            {inscripciones.map((inscripcion) => (
                                <tr
                                    key={inscripcion.id}
                                    // Una fila de tabla no puede ser un <button>
                                    // (rompería el HTML), así que se le da el
                                    // papel de botón a mano: rol, foco con
                                    // Tab y respuesta a Enter / Espacio. Sin
                                    // esto la función solo existiría para quien
                                    // usa ratón.
                                    role="button"
                                    tabIndex={0}
                                    aria-label={`Ver jugadores de ${inscripcion.team.name}`}
                                    onClick={() => setAbierta(inscripcion)}
                                    onKeyDown={(evento) => {
                                        if (evento.key === 'Enter' || evento.key === ' ') {
                                            // Espacio, sin esto, haría scroll.
                                            evento.preventDefault();
                                            setAbierta(inscripcion);
                                        }
                                    }}
                                    className="cursor-pointer bg-gray-900/40 transition hover:bg-gray-800/60 focus:outline-none focus-visible:bg-gray-800/60 focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-pink-500"
                                >
                                    <td className="py-3 pl-4 pr-0">
                                        <span className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-950/60">
                                            {inscripcion.team.logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={inscripcion.team.logoUrl}
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
                                        {inscripcion.team.name}
                                    </td>
                                    <td className="px-4 py-3 text-gray-300">
                                        {etiquetaCategoria[inscripcion.category]}
                                    </td>
                                    <td className="hidden px-4 py-3 text-right text-gray-300 sm:table-cell">
                                        {inscripcion._count.memberships}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}

            {/* ---------- Ventana emergente con el plantel ---------- */}
            {/* Se monta siempre; es el propio modal el que decide no pintar
                nada mientras `inscripcion` sea null. Así el estado de carga se
                reinicia solo cada vez que se abre un equipo distinto. */}
            <EquipoRosterModal
                inscripcion={abierta}
                temporada={elegida ? nombreTemporada(elegida.liga, elegida.temporada.number) : undefined}
                onCerrar={() => setAbierta(null)}
            />
        </div>
    );
}
