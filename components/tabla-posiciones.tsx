'use client';

import { useState } from 'react';
import { cn } from '@/lib/cn';
import Tarjeta from '@/components/ui/tarjeta';
import { Nota } from '@/components/ui/estado';
import LogoEquipo from '@/components/logo-equipo';
import EquipoRosterModal from '@/app/equipos/equipo-roster-modal';
import type { TeamSeason } from '@/lib/season-ui';
import { conSigno, type FilaTabla, type TablaCategoria } from '@/lib/tabla-ui';

/**
 * UNA tabla de posiciones (una categoría de una temporada). Solo pinta: los
 * números ya llegan calculados y ordenados por calcularTablas
 * (lib/tabla-ui.ts). El título ("Varonil libre", "LDT VII · Mixto") lo pone
 * quien la usa, porque cambia según la pantalla.
 *
 *   <TablaPosiciones tabla={t} conEmpates={p.conEmpates} temporada="LDT VII" />
 *   <TablaPosiciones … variante="compacta" />   ← carrusel de la portada
 *
 * Variantes:
 *   - completa:  #  Equipo  PJ  G  P  (E)  PF  PC  DIF  PTS
 *   - compacta:  #  Equipo  G  P  (E)  PTS
 * La columna E solo aparece si `conEmpates` (hubo al menos un empate en la
 * TEMPORADA; decisión de Abel).
 *
 * El logo y el nombre del equipo son un botón que abre su plantel (el mismo
 * modal de /equipos y de la página de la temporada).
 *
 * En teléfono la tabla completa se desliza de lado DENTRO de su tarjeta, y
 * la celda de posición + equipo queda fija a la izquierda (sticky) para no
 * perder de quién son los números.
 *
 * Las filas NO reaccionan al hover (a diferencia del patrón general de
 * tablas de design.md): la fila no es clicable, solo el equipo, y ese sí
 * tiene su propio hover.
 */

type Variante = 'completa' | 'compacta';

type Columna = {
    clave: string;
    abreviatura: string;
    nombre: string;
    valor: (fila: FilaTabla) => string | number;
    /** PTS: el número que decide la tabla, en tinta y negritas. */
    principal?: boolean;
};

const columnas = {
    jugados: { clave: 'pj', abreviatura: 'PJ', nombre: 'Partidos jugados', valor: (f) => f.jugados },
    ganados: { clave: 'g', abreviatura: 'G', nombre: 'Ganados', valor: (f) => f.ganados },
    perdidos: { clave: 'p', abreviatura: 'P', nombre: 'Perdidos', valor: (f) => f.perdidos },
    empatados: { clave: 'e', abreviatura: 'E', nombre: 'Empatados', valor: (f) => f.empatados },
    favor: { clave: 'pf', abreviatura: 'PF', nombre: 'Puntos a favor', valor: (f) => f.puntosFavor },
    contra: { clave: 'pc', abreviatura: 'PC', nombre: 'Puntos en contra', valor: (f) => f.puntosContra },
    diferencia: {
        clave: 'dif',
        abreviatura: 'DIF',
        nombre: 'Diferencia de puntos',
        valor: (f) => conSigno(f.diferencia),
    },
    puntos: {
        clave: 'pts',
        abreviatura: 'PTS',
        nombre: 'Puntos (ganados menos perdidos)',
        valor: (f) => conSigno(f.puntos),
        principal: true,
    },
} satisfies Record<string, Columna>;

const columnasDe = (variante: Variante, conEmpates: boolean): Columna[] => {
    const c = columnas;
    const lista =
        variante === 'completa'
            ? [c.jugados, c.ganados, c.perdidos, c.empatados, c.favor, c.contra, c.diferencia, c.puntos]
            : [c.ganados, c.perdidos, c.empatados, c.puntos];
    return conEmpates ? lista : lista.filter((col) => col.clave !== 'e');
};

export default function TablaPosiciones({
    tabla,
    conEmpates,
    temporada,
    variante = 'completa',
    className,
}: {
    tabla: TablaCategoria;
    conEmpates: boolean;
    /** Nombre de la temporada para el subtítulo del plantel ("LDT VII"). */
    temporada: string;
    variante?: Variante;
    className?: string;
}) {
    // Se guarda el objeto ya armado (y no la fila) para que su identidad no
    // cambie en cada render: el modal vuelve a pedir el plantel cada vez que
    // recibe un objeto nuevo.
    const [abierta, setAbierta] = useState<Pick<TeamSeason, 'id' | 'category' | 'team'> | null>(null);

    const compacta = variante === 'compacta';
    const cols = columnasDe(variante, conEmpates);
    const sinPartidos = tabla.filas.every((f) => f.jugados === 0);

    // Relleno de celda: más apretado en la compacta, que vive en un carrusel.
    const celda = compacta ? 'px-2.5 py-2 sm:px-3' : 'px-3 py-3 sm:px-4';

    return (
        <div className={cn('space-y-3', className)}>
            {/* La completa va en su propia tarjeta panel (`sm:p-0` también: cn no
                quita el `sm:p-6` del panel con un `p-0` a secas). La compacta
                siempre vive DENTRO de otra tarjeta (el carrusel de la portada),
                así que usa un recuadro `rounded-item`, como pide la regla de
                anidado de design.md. */}
            <Tarjeta
                variante="panel"
                className={cn('overflow-hidden p-0 sm:p-0', compacta && 'rounded-item bg-transparent')}
            >
                <div className={cn(!compacta && 'overflow-x-auto')}>
                    <table className={cn('w-full tabular-nums', compacta ? 'text-meta' : 'text-cuerpo')}>
                        <thead>
                            <tr className="text-leyenda uppercase tracking-wider text-tenue">
                                <th
                                    scope="col"
                                    className={cn(
                                        celda,
                                        'text-left font-medium',
                                        !compacta && 'sticky left-0 z-10 bg-superficie',
                                    )}
                                >
                                    <span className="inline-block w-6 text-right">#</span>
                                    <span className="ml-3">Equipo</span>
                                </th>
                                {cols.map((col) => (
                                    <th key={col.clave} scope="col" className={cn(celda, 'text-right font-medium')}>
                                        <abbr title={col.nombre} className="no-underline">
                                            {col.abreviatura}
                                        </abbr>
                                    </th>
                                ))}
                            </tr>
                        </thead>

                        <tbody>
                            {tabla.filas.map((fila) => (
                                <tr key={fila.teamSeasonId} className="border-t border-borde">
                                    <th
                                        scope="row"
                                        className={cn(
                                            celda,
                                            'text-left font-normal',
                                            !compacta && 'sticky left-0 z-10 bg-superficie',
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <span className="w-6 shrink-0 text-right text-tenue">{fila.posicion}</span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    setAbierta({
                                                        id: fila.teamSeasonId,
                                                        category: tabla.category,
                                                        team: fila.team,
                                                    })
                                                }
                                                title={`Ver plantel de ${fila.team.name}`}
                                                className="group flex min-w-0 items-center gap-2.5 rounded-insignia text-left"
                                            >
                                                <LogoEquipo
                                                    nombre={fila.team.name}
                                                    logoUrl={fila.team.logoUrl}
                                                    tamano={compacta ? 24 : 28}
                                                />
                                                <span
                                                    className={cn(
                                                        'truncate font-semibold text-tinta',
                                                        'underline decoration-transparent underline-offset-4 transition-colors',
                                                        'group-hover:decoration-tinta',
                                                        // En teléfono el nombre se corta para que la
                                                        // columna fija no tape los números.
                                                        compacta ? 'max-w-[9rem] sm:max-w-[14rem]' : 'max-w-[8rem] sm:max-w-none',
                                                    )}
                                                >
                                                    {fila.team.name}
                                                </span>
                                            </button>
                                        </div>
                                    </th>
                                    {cols.map((col) => (
                                        <td
                                            key={col.clave}
                                            className={cn(
                                                celda,
                                                'whitespace-nowrap text-right',
                                                col.principal ? 'font-semibold text-tinta' : 'text-tinta-2',
                                            )}
                                        >
                                            {col.valor(fila)}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Tarjeta>

            {sinPartidos && <Nota>Aún no hay partidos de temporada regular jugados en esta categoría.</Nota>}

            <EquipoRosterModal
                inscripcion={abierta}
                temporada={temporada}
                onCerrar={() => setAbierta(null)}
            />
        </div>
    );
}
