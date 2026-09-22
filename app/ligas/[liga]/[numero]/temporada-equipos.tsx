'use client';

import { useState } from 'react';
import { teamCategories } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TeamSeason } from '@/lib/season-ui';
import EquipoRosterModal from '@/app/equipos/equipo-roster-modal';

/**
 * Sección "Equipos" de la página de una temporada.
 *
 * Los datos YA llegan resueltos desde el servidor (page.tsx), así que aquí
 * no hay fetch inicial ni "cargando": solo la interactividad de abrir el
 * plantel de un equipo, que reutiliza el mismo modal de /equipos.
 *
 * Los equipos se agrupan por categoría: es como se lee una liga de tocho.
 */
export default function TemporadaEquipos({
    inscripciones,
    temporada,
}: {
    inscripciones: TeamSeason[];
    temporada: string;
}) {
    const [abierta, setAbierta] = useState<TeamSeason | null>(null);

    if (inscripciones.length === 0) {
        return (
            <p className="text-center text-gray-400">
                Todavía no hay equipos inscritos en esta temporada.
            </p>
        );
    }

    return (
        <section className="space-y-8">
            <h2 className="text-2xl font-semibold text-white">Equipos</h2>

            {teamCategories.map((categoria) => {
                const deLaCategoria = inscripciones.filter((i) => i.category === categoria);
                if (deLaCategoria.length === 0) return null;

                return (
                    <div key={categoria} className="space-y-3">
                        <h3 className="text-sm font-semibold uppercase tracking-wide text-gray-400">
                            {etiquetaCategoria[categoria]} · {deLaCategoria.length}
                        </h3>
                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                            {deLaCategoria.map((inscripcion) => (
                                <li key={inscripcion.id}>
                                    <button
                                        type="button"
                                        onClick={() => setAbierta(inscripcion)}
                                        className="flex w-full items-center gap-3 rounded-lg border border-gray-800 bg-gray-900/40 p-4 text-left transition hover:border-pink-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                                    >
                                        <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-950/60">
                                            {inscripcion.team.logoUrl ? (
                                                // eslint-disable-next-line @next/next/no-img-element
                                                <img
                                                    src={inscripcion.team.logoUrl}
                                                    alt=""
                                                    className="h-full w-full object-contain"
                                                />
                                            ) : (
                                                <span className="text-[9px] uppercase text-gray-600">s/l</span>
                                            )}
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block truncate font-semibold text-white">
                                                {inscripcion.team.name}
                                            </span>
                                            <span className="text-sm text-gray-500">
                                                {inscripcion._count.memberships}{' '}
                                                {inscripcion._count.memberships === 1 ? 'jugador' : 'jugadores'}
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                        </ul>
                    </div>
                );
            })}

            <EquipoRosterModal inscripcion={abierta} temporada={temporada} onCerrar={() => setAbierta(null)} />
        </section>
    );
}
