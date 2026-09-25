'use client';

import { useState } from 'react';
import { teamCategories } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TeamSeason } from '@/lib/season-ui';
import TarjetaEquipo from '@/components/tarjeta-equipo';
import { TituloSeccion } from '@/components/ui/pagina';
import { Vacio } from '@/components/ui/estado';
import EquipoRosterModal from '@/app/equipos/equipo-roster-modal';

/**
 * Sección "Equipos" de la página de una temporada.
 *
 * Los datos YA llegan resueltos desde el servidor (page.tsx), así que aquí
 * no hay fetch inicial ni "cargando": solo la interactividad de abrir el
 * plantel de un equipo, que reutiliza el mismo modal de /equipos.
 *
 * Los equipos se agrupan por categoría: es como se lee una liga de tocho.
 * La tarjeta es la misma de /equipos (TarjetaEquipo), sin la insignia de
 * categoría porque ya la dice el título del grupo.
 */
export default function TemporadaEquipos({
    inscripciones,
    temporada,
}: {
    inscripciones: TeamSeason[];
    temporada: string;
}) {
    const [abierta, setAbierta] = useState<TeamSeason | null>(null);

    return (
        <section>
            <TituloSeccion>Equipos</TituloSeccion>

            {inscripciones.length === 0 ? (
                <Vacio>Todavía no hay equipos inscritos en esta temporada.</Vacio>
            ) : (
                <div className="space-y-8">
                    {teamCategories.map((categoria) => {
                        const deLaCategoria = inscripciones.filter((i) => i.category === categoria);
                        if (deLaCategoria.length === 0) return null;

                        return (
                            <div key={categoria} className="space-y-3">
                                <h3 className="text-leyenda font-medium uppercase tracking-wider text-tenue">
                                    {etiquetaCategoria[categoria]} · {deLaCategoria.length}
                                </h3>
                                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                    {deLaCategoria.map((inscripcion) => (
                                        <li key={inscripcion.id}>
                                            <TarjetaEquipo
                                                inscripcion={inscripcion}
                                                onAbrir={() => setAbierta(inscripcion)}
                                                mostrarCategoria={false}
                                            />
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        );
                    })}
                </div>
            )}

            <EquipoRosterModal inscripcion={abierta} temporada={temporada} onCerrar={() => setAbierta(null)} />
        </section>
    );
}
