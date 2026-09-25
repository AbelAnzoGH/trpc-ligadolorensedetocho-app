'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { trpcQuery } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import TarjetaEquipo from '@/components/tarjeta-equipo';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseEnlace } from '@/components/ui/enlace';
import { Cargando, MensajeError, Vacio } from '@/components/ui/estado';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import {
    nombreTemporada,
    urlTemporada,
    type TeamSeason,
    type ListTeamSeasonsResponse,
} from '@/lib/season-ui';
import EquipoRosterModal from './equipo-roster-modal';

/**
 * Listado público de equipos: SOLO lectura.
 * No importa trpcMutation a propósito — desde esta página no se puede
 * crear, editar ni borrar nada. Eso vive en /manejar-equipos y /manejar-temporadas.
 *
 * Lo que se lista NO son equipos a secas sino INSCRIPCIONES: "Patito en
 * LDT VII, varonil". Por eso primero se elige liga y temporada, y el mismo
 * equipo puede salir dos veces si juega varonil y mixto.
 *
 * Diseño: una rejilla de tarjetas (antes era una tabla). Son pocas columnas
 * de datos y lo que identifica a un equipo es su logo, así que la tarjeta
 * le da el espacio. La tarjeta (components/tarjeta-equipo.tsx) es la misma
 * que usa la página de cada temporada.
 */
export default function EquiposTabla() {
    const { ligas, cargando: cargandoLigas, error: errorLigas, seasonId, setSeasonId, elegida } = useLigas();

    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // Filtro del listado ('' = todas las categorías). Solo se ofrecen las
    // categorías de la temporada elegida; si el filtro guardado no existe en
    // ella (se cambió de temporada), cuenta como "Todas".
    const [filtroElegido, setFiltro] = useState<TeamCategory | ''>('');
    const categoriasTemporada = elegida?.temporada.categories ?? [];
    const filtro: TeamCategory | '' =
        filtroElegido && categoriasTemporada.includes(filtroElegido) ? filtroElegido : '';

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

    if (cargandoLigas) return <Cargando texto="Cargando temporadas…" />;
    if (errorLigas) return <MensajeError>Error: {errorLigas}</MensajeError>;

    return (
        <div className="space-y-6">
            {/* ---------- Barra de filtros ---------- */}
            <div className="flex flex-wrap items-end gap-3 border-b border-borde pb-6">
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} />

                <div className={claseGrupoCampo}>
                    <label htmlFor="filtro" className={claseEtiqueta}>
                        Categoría
                    </label>
                    <select
                        id="filtro"
                        value={filtro}
                        onChange={(e) => setFiltro(e.target.value as TeamCategory | '')}
                        className={`${claseCampo} min-w-40`}
                    >
                        <option value="">Todas</option>
                        {categoriasTemporada.map((c) => (
                            <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                        ))}
                    </select>
                </div>
            </div>

            {elegida && (
                <p className="text-meta text-tenue">
                    {!cargando && !error && (
                        <>
                            {inscripciones.length} {inscripciones.length === 1 ? 'equipo' : 'equipos'} en{' '}
                        </>
                    )}
                    <Link href={urlTemporada(elegida.liga, elegida.temporada.number)} className={claseEnlace}>
                        {nombreTemporada(elegida.liga, elegida.temporada.number)}
                    </Link>
                    {!cargando && !error && inscripciones.length > 0 && ' · Elige un equipo para ver su plantel.'}
                </p>
            )}

            {/* ---------- Equipos ---------- */}
            {cargando && <Cargando texto="Cargando equipos…" />}
            {error && <MensajeError>Error: {error}</MensajeError>}

            {!cargando && !error && inscripciones.length === 0 && (
                <Vacio>
                    {seasonId
                        ? 'Todavía no hay equipos inscritos en esta temporada.'
                        : 'Todavía no hay temporadas registradas.'}
                </Vacio>
            )}

            {!cargando && !error && inscripciones.length > 0 && (
                <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {inscripciones.map((inscripcion) => (
                        <li key={inscripcion.id}>
                            <TarjetaEquipo inscripcion={inscripcion} onAbrir={() => setAbierta(inscripcion)} />
                        </li>
                    ))}
                </ul>
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
