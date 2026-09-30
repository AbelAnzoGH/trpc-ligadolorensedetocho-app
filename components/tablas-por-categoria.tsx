import TablaPosiciones from '@/components/tabla-posiciones';
import { Vacio } from '@/components/ui/estado';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TablasTemporada } from '@/lib/tabla-ui';

/**
 * Todas las tablas de UNA temporada, apiladas: un grupo por categoría con su
 * título ("VARONIL LIBRE") y su tabla completa.
 *
 * Lo usan /posiciones y la página de la temporada, para que las dos se vean
 * igual por construcción (decisión de Abel).
 *
 * Sin 'use client': no tiene estado. La interactividad (abrir un plantel)
 * vive dentro de cada <TablaPosiciones>.
 */
export default function TablasPorCategoria({
    posiciones,
    temporada,
}: {
    posiciones: TablasTemporada;
    /** Nombre de la temporada ("LDT VII"), para el subtítulo del plantel. */
    temporada: string;
}) {
    if (posiciones.tablas.length === 0) {
        return <Vacio>Todavía no hay equipos inscritos en esta temporada.</Vacio>;
    }

    return (
        <div className="space-y-8">
            {posiciones.tablas.map((tabla) => (
                <div key={tabla.category} className="space-y-3">
                    <h3 className="text-leyenda font-medium uppercase tracking-wider text-tenue">
                        {etiquetaCategoria[tabla.category]}
                    </h3>
                    <TablaPosiciones tabla={tabla} conEmpates={posiciones.conEmpates} temporada={temporada} />
                </div>
            ))}
        </div>
    );
}
