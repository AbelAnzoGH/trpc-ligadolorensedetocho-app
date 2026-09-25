'use client';

import { useState } from 'react';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria, inputClass } from '@/lib/team-ui';
import { agruparPorJornada, formatoDiaPartido, type Game } from '@/lib/game-ui';
import PartidoCompacto from '@/components/partido-compacto';
import PartidoDetalleModal from '@/components/partido-detalle-modal';

/**
 * Sección "Rol de juegos" de la página pública de una temporada. SOLO lectura.
 *
 * Igual que TemporadaEquipos, los datos llegan resueltos desde el servidor
 * (page.tsx): aquí no hay fetch ni "cargando", solo el filtro de categoría,
 * que se aplica en el navegador sobre los partidos que ya se tienen.
 *
 * Orden: el servidor manda los partidos por fecha y hora (el más temprano
 * primero), y agruparPorJornada respeta ese orden dentro de cada jornada.
 *
 * Cada partido se ve compacto (hora, logos y marcador); al hacer clic se
 * abren todos sus detalles en PartidoDetalleModal.
 */
export default function TemporadaPartidos({
    partidos,
    categorias,
}: {
    partidos: Game[];
    /** Las categorías de la temporada, para el filtro. */
    categorias: TeamCategory[];
}) {
    const [filtroElegido, setFiltro] = useState<TeamCategory | ''>('');
    // Partido cuyos detalles se ven. null = modal cerrado.
    const [abierto, setAbierto] = useState<Game | null>(null);
    const filtro: TeamCategory | '' = filtroElegido && categorias.includes(filtroElegido) ? filtroElegido : '';

    const visibles = filtro ? partidos.filter((p) => p.homeTeamSeason.category === filtro) : partidos;
    const grupos = agruparPorJornada(visibles);

    return (
        <section className="space-y-6">
            <div className="flex flex-wrap items-end justify-between gap-3">
                <h2 className="text-2xl font-semibold text-white">Rol de juegos</h2>
                {categorias.length > 1 && partidos.length > 0 && (
                    <div className="flex flex-col gap-1">
                        <label htmlFor="rol-categoria" className="text-sm text-gray-300">Categoría</label>
                        <select
                            id="rol-categoria"
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value as TeamCategory | '')}
                            className={`${inputClass} py-1 text-sm`}
                        >
                            <option value="">Todas</option>
                            {categorias.map((c) => (
                                <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                            ))}
                        </select>
                    </div>
                )}
            </div>

            {partidos.length === 0 && (
                <p className="text-gray-400">Todavía no hay partidos programados en esta temporada.</p>
            )}

            {partidos.length > 0 && grupos.length === 0 && (
                <p className="text-gray-400">No hay partidos de {etiquetaCategoria[filtro as TeamCategory]}.</p>
            )}

            {grupos.map((grupo) => (
                <div key={grupo.clave} className="space-y-3">
                    <h3 className="font-semibold text-gray-200">
                        {grupo.titulo}
                        {grupo.diaComun && (
                            <span className="font-normal text-gray-400"> · {formatoDiaPartido(grupo.diaComun)}</span>
                        )}
                    </h3>
                    <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                        {grupo.partidos.map((p) => (
                            <PartidoCompacto
                                key={p.id}
                                partido={p}
                                soloHora={grupo.diaComun !== null}
                                onAbrir={() => setAbierto(p)}
                            />
                        ))}
                    </ul>
                </div>
            ))}

            <PartidoDetalleModal partido={abierto} onCerrar={() => setAbierto(null)} />
        </section>
    );
}
