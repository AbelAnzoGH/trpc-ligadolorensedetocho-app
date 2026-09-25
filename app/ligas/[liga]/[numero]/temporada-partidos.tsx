'use client';

import { useState } from 'react';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import { agruparPorJornada, formatoDiaPartido, type Game } from '@/lib/game-ui';
import PartidoCompacto from '@/components/partido-compacto';
import PartidoDetalleModal from '@/components/partido-detalle-modal';
import { TituloSeccion } from '@/components/ui/pagina';
import { Vacio } from '@/components/ui/estado';
import { claseCampo } from '@/components/ui/campo';

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
        <section>
            <TituloSeccion
                acciones={
                    categorias.length > 1 &&
                    partidos.length > 0 && (
                        // La etiqueta visible sobraría junto al título: el
                        // "Todas las categorías" ya explica qué filtra. Para el
                        // lector de pantalla se deja con sr-only.
                        <div>
                            <label htmlFor="rol-categoria" className="sr-only">
                                Categoría
                            </label>
                            <select
                                id="rol-categoria"
                                value={filtro}
                                onChange={(e) => setFiltro(e.target.value as TeamCategory | '')}
                                className={`${claseCampo} min-w-48`}
                            >
                                <option value="">Todas las categorías</option>
                                {categorias.map((c) => (
                                    <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                                ))}
                            </select>
                        </div>
                    )
                }
            >
                Rol de juegos
            </TituloSeccion>

            {partidos.length === 0 && <Vacio>Todavía no hay partidos programados en esta temporada.</Vacio>}

            {partidos.length > 0 && grupos.length === 0 && (
                <Vacio>No hay partidos de {etiquetaCategoria[filtro as TeamCategory]}.</Vacio>
            )}

            <div className="space-y-8">
                {grupos.map((grupo) => (
                    <div key={grupo.clave} className="space-y-3">
                        <h3 className="text-cuerpo font-semibold text-tinta-2">
                            {grupo.titulo}
                            {grupo.diaComun && (
                                <span className="font-normal text-tenue">
                                    {' '}· {formatoDiaPartido(grupo.diaComun)}
                                </span>
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
            </div>

            <PartidoDetalleModal partido={abierto} onCerrar={() => setAbierto(null)} />
        </section>
    );
}
