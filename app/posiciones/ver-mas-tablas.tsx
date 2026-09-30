'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/modal';
import Boton, { type TamanoBoton } from '@/components/ui/boton';
import Insignia from '@/components/ui/insignia';
import { Cargando, MensajeError, Vacio } from '@/components/ui/estado';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import SelectorTemporada from '@/components/selector-temporada';
import TablaPosiciones from '@/components/tabla-posiciones';
import { useLigas } from '@/utils/use-ligas';
import { trpcQuery } from '@/utils/trpc-fetch';
import { cn } from '@/lib/cn';
import { nombreTemporada, etiquetaEstado, tonoEstadoTemporada } from '@/lib/season-ui';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TeamCategory } from '@/lib/team-schema';
import type { PosicionesTemporada, StandingsResponse } from '@/lib/tabla-ui';

/**
 * Botón "Ver más" de /posiciones + el modal para consultar CUALQUIER tabla
 * (de cualquier liga, temporada y estado).
 *
 * El modal no pide nada hasta que se abre: el componente de adentro
 * (ConsultaTablas) solo existe mientras el modal está abierto, porque
 * <Modal> no pinta a sus hijos cuando está cerrado.
 */
export default function VerMasTablas({ tamano = 'md' }: { tamano?: TamanoBoton }) {
    const [abierto, setAbierto] = useState(false);

    return (
        <>
            <Boton variante="secundario" tamano={tamano} onClick={() => setAbierto(true)}>
                Ver más
            </Boton>

            <Modal
                abierto={abierto}
                onCerrar={() => setAbierto(false)}
                titulo="Consultar tablas"
                subtitulo="Cualquier temporada de cualquier liga"
                ancho="amplio"
            >
                <ConsultaTablas />
            </Modal>
        </>
    );
}

/**
 * Filtros en cascada (liga → temporada → categoría) y la tabla elegida.
 *
 * Al abrir ya vienen elegidos (decisión de Abel), para que la tabla salga
 * de inmediato:
 *   - liga y temporada: la regla de siempre de useLigas (la activa de la
 *     LDT o, si no hay, la más reciente);
 *   - categoría: la primera de las que se juegan en esa temporada.
 */
function ConsultaTablas() {
    const { ligas, cargando, error, seasonId, setSeasonId, elegida } = useLigas();

    // La categoría que eligió el usuario. Si al cambiar de temporada esa
    // categoría no se juega ahí, se usa la primera de la nueva temporada.
    // Se CALCULA en cada render (categoriaActual) en vez de corregirla con
    // un useEffect: así nunca hay un render intermedio con una combinación
    // imposible.
    const [categoria, setCategoria] = useState<TeamCategory | null>(null);
    const categorias = elegida?.temporada.categories ?? [];
    const categoriaActual = categoria && categorias.includes(categoria) ? categoria : (categorias[0] ?? null);

    // Cada respuesta se guarda junto con la selección que la pidió ("clave").
    // En pantalla solo se muestra si esa clave es la de lo elegido AHORA:
    // así, al cambiar un filtro, la tabla anterior desaparece al instante y
    // una respuesta vieja que llegue tarde nunca se pinta.
    const clave = seasonId && categoriaActual ? `${seasonId}:${categoriaActual}` : null;
    const [resultado, setResultado] = useState<{ clave: string; data: PosicionesTemporada } | null>(null);
    const [falla, setFalla] = useState<{ clave: string; mensaje: string } | null>(null);

    useEffect(() => {
        if (!seasonId || !categoriaActual) return;
        const pedida = `${seasonId}:${categoriaActual}`;

        trpcQuery<StandingsResponse>('getStandings', { seasonId, category: categoriaActual })
            .then((r) => setResultado({ clave: pedida, data: r.data }))
            .catch((err: unknown) =>
                setFalla({ clave: pedida, mensaje: err instanceof Error ? err.message : 'Error desconocido' }),
            );
    }, [seasonId, categoriaActual]);

    if (cargando) return <Cargando />;
    if (error) return <MensajeError>{error}</MensajeError>;

    const vigente = resultado && resultado.clave === clave ? resultado.data : null;
    const errorTabla = falla && falla.clave === clave ? falla.mensaje : null;
    const tabla = vigente?.tablas[0] ?? null;

    return (
        <div className="space-y-6">
            {/* Barra de filtros (design.md): sin caja, separada con un borde abajo. */}
            <div className="flex flex-wrap items-end gap-3 border-b border-borde pb-5">
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} idPrefix="posiciones" />

                <div className={claseGrupoCampo}>
                    <label htmlFor="posiciones-categoria" className={claseEtiqueta}>
                        Categoría
                    </label>
                    <select
                        id="posiciones-categoria"
                        value={categoriaActual ?? ''}
                        onChange={(e) => setCategoria(e.target.value as TeamCategory)}
                        disabled={categorias.length === 0}
                        className={cn(claseCampo, 'min-w-44')}
                    >
                        {categorias.length === 0 && <option value="">Sin categorías</option>}
                        {categorias.map((c) => (
                            <option key={c} value={c}>
                                {etiquetaCategoria[c]}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {!elegida ? (
                <Vacio>Todavía no hay temporadas registradas.</Vacio>
            ) : categorias.length === 0 ? (
                <Vacio>Esta temporada todavía no tiene categorías.</Vacio>
            ) : errorTabla ? (
                <MensajeError>{errorTabla}</MensajeError>
            ) : !vigente ? (
                <Cargando />
            ) : !tabla ? (
                <Vacio>No hay equipos inscritos en esta categoría.</Vacio>
            ) : (
                <div className="space-y-3">
                    <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                        <h3 className="text-cuerpo font-semibold text-tinta-2">
                            {nombreTemporada(vigente.temporada.league, vigente.temporada.number)}
                            <span className="font-normal text-tenue"> · {etiquetaCategoria[tabla.category]}</span>
                        </h3>
                        <Insignia tono={tonoEstadoTemporada[vigente.temporada.status]}>
                            {etiquetaEstado[vigente.temporada.status]}
                        </Insignia>
                    </div>
                    <TablaPosiciones
                        tabla={tabla}
                        conEmpates={vigente.conEmpates}
                        temporada={nombreTemporada(vigente.temporada.league, vigente.temporada.number)}
                    />
                </div>
            )}
        </div>
    );
}
