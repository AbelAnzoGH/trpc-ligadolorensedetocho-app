import { TituloSeccion } from '@/components/ui/pagina';
import TablasPorCategoria from '@/components/tablas-por-categoria';
import { calcularTablas } from '@/lib/tabla-ui';
import type { TeamSeason } from '@/lib/season-ui';
import type { Game } from '@/lib/game-ui';

/**
 * Sección "Tabla de posiciones" de la página de una temporada.
 *
 * No pide nada al servidor: page.tsx ya trae las inscripciones y TODOS los
 * partidos de la temporada (para el rol), y calcularTablas se queda solo con
 * los que cuentan (regular + finalizado). Es el mismo cálculo que usa
 * /posiciones, así que las dos pantallas siempre dicen lo mismo.
 *
 * Sin 'use client': es un server component; solo pinta.
 */
export default function TemporadaPosiciones({
    inscripciones,
    partidos,
    temporada,
}: {
    inscripciones: TeamSeason[];
    partidos: Game[];
    temporada: string;
}) {
    const posiciones = calcularTablas(inscripciones, partidos);

    return (
        <section>
            <TituloSeccion descripcion="Solo cuentan los partidos de temporada regular.">
                Tabla de posiciones
            </TituloSeccion>
            <TablasPorCategoria posiciones={posiciones} temporada={temporada} />
        </section>
    );
}
