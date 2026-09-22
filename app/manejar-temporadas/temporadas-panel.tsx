'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import { teamCategories, type TeamCategory } from '@/lib/team-schema';
import { seasonStatuses, type SeasonStatus } from '@/lib/season-schema';
import { etiquetaCategoria, inputClass, type Team, type ListTeamsResponse } from '@/lib/team-ui';
import {
    romano,
    nombreTemporada,
    urlTemporada,
    etiquetaEstado,
    claseEstado,
    type TeamSeason,
    type ListTeamSeasonsResponse,
} from '@/lib/season-ui';
import InscripcionFila from './inscripcion-fila';

const botonPrimario =
    'rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-5 py-2 font-semibold text-white transition duration-300 hover:bg-linear-to-l disabled:opacity-50';

/**
 * Panel de administración de temporadas. Tres secciones, de arriba abajo en
 * el orden en que se usan al arrancar una temporada nueva:
 *
 *   1. Ligas          → crear LDT, LDT SHADOWS, LDT INTERPREPAS (una vez)
 *   2. Temporadas     → crear "LDT VIII" y moverla por su ciclo de vida
 *                       (inscripciones → activa → cerrada)
 *   3. Inscripciones  → en la temporada elegida: inscribir equipos, copiar
 *                       plantillas, capturar las estadísticas del equipo
 *
 * Un solo useLigas() para todo el panel: cuando se crea una temporada en la
 * sección 2, el selector de la sección 3 la ve de inmediato.
 */
export default function TemporadasPanel() {
    const { ligas, cargando, error, seasonId, setSeasonId, recargar, elegida } = useLigas();
    const [guardando, setGuardando] = useState(false);

    // Ejecuta una mutación con el patrón de siempre: toast de éxito o de error
    // y recarga. Devuelve true si salió bien, para limpiar formularios.
    const ejecutar = useCallback(
        async (accion: () => Promise<unknown>, exito: string, despues?: () => Promise<void>) => {
            setGuardando(true);
            try {
                await accion();
                toast.success(exito);
                await recargar();
                if (despues) await despues();
                return true;
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Error desconocido');
                return false;
            } finally {
                setGuardando(false);
            }
        },
        [recargar],
    );

    // ======================= 1. LIGAS =======================
    const [ligaNombre, setLigaNombre] = useState('');
    const [ligaSlug, setLigaSlug] = useState('');

    const onCrearLiga = async (e: React.FormEvent) => {
        e.preventDefault();
        const ok = await ejecutar(
            () => trpcMutation('createLeague', { name: ligaNombre.trim(), slug: ligaSlug.trim() }),
            `Liga ${ligaNombre.trim()} creada`,
        );
        if (ok) {
            setLigaNombre('');
            setLigaSlug('');
        }
    };

    // ======================= 2. TEMPORADAS =======================
    const [temporadaLiga, setTemporadaLiga] = useState('');
    const [temporadaNumero, setTemporadaNumero] = useState('');
    const [temporadaEstado, setTemporadaEstado] = useState<SeasonStatus>('inscripciones');

    // Propone el número siguiente al elegir la liga: si la última es la VII,
    // lo normal es crear la VIII. El admin lo puede cambiar.
    const elegirLigaParaTemporada = (leagueId: string) => {
        setTemporadaLiga(leagueId);
        const liga = ligas.find((l) => l.id === leagueId);
        const ultima = liga?.seasons[0]?.number ?? 0;
        setTemporadaNumero(leagueId ? String(ultima + 1) : '');
    };

    const onCrearTemporada = async (e: React.FormEvent) => {
        e.preventDefault();
        const liga = ligas.find((l) => l.id === temporadaLiga);
        if (!liga || !temporadaNumero) {
            toast.error('Elige la liga y el número de temporada');
            return;
        }
        const numero = Number(temporadaNumero);
        const ok = await ejecutar(
            () =>
                trpcMutation('createSeason', {
                    leagueId: liga.id,
                    number: numero,
                    status: temporadaEstado,
                }),
            `${nombreTemporada(liga, numero)} creada`,
        );
        if (ok) {
            setTemporadaLiga('');
            setTemporadaNumero('');
            setTemporadaEstado('inscripciones');
        }
    };

    const onCambiarEstado = (id: string, status: SeasonStatus, nombre: string) =>
        ejecutar(() => trpcMutation('updateSeason', { id, status }), `${nombre}: ${etiquetaEstado[status]}`);

    const onEliminarTemporada = (id: string, nombre: string) =>
        ejecutar(() => trpcMutation('deleteSeason', { id }), `${nombre} eliminada`);

    // ======================= 3. INSCRIPCIONES =======================
    const [equipos, setEquipos] = useState<Team[]>([]);
    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [cargandoInscripciones, setCargandoInscripciones] = useState(false);
    const [inscribirEquipo, setInscribirEquipo] = useState('');
    const [inscribirCategoria, setInscribirCategoria] = useState<TeamCategory>('varonil');

    const cargarInscripciones = useCallback(async () => {
        if (!seasonId) {
            setInscripciones([]);
            return;
        }
        setCargandoInscripciones(true);
        try {
            const [resp, respEquipos] = await Promise.all([
                trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', { seasonId }),
                trpcQuery<ListTeamsResponse>('listTeams'),
            ]);
            setInscripciones(resp.data.teamSeasons);
            setEquipos(respEquipos.data.teams);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargandoInscripciones(false);
        }
    }, [seasonId]);

    useEffect(() => {
        cargarInscripciones();
    }, [cargarInscripciones]);

    const onInscribir = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inscribirEquipo) {
            toast.error('Elige un equipo');
            return;
        }
        const ok = await ejecutar(
            () =>
                trpcMutation('enrollTeam', {
                    seasonId,
                    teamId: inscribirEquipo,
                    category: inscribirCategoria,
                }),
            'Equipo inscrito',
            cargarInscripciones,
        );
        if (ok) setInscribirEquipo('');
    };

    if (cargando) return <p className="text-gray-300">Cargando ligas...</p>;
    if (error) return <p className="text-red-400">Error: {error}</p>;

    const temporadaCerrada = elegida?.temporada.status === 'cerrada';

    return (
        <div className="space-y-10">
            {/* ======================= 1. LIGAS ======================= */}
            <section className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-6">
                <h2 className="text-xl font-semibold text-white">1 · Ligas</h2>

                {ligas.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                        {ligas.map((liga) => (
                            <li
                                key={liga.id}
                                className="rounded-full border border-gray-700 px-3 py-1 text-sm text-gray-300"
                            >
                                <strong className="text-white">{liga.name}</strong>{' '}
                                <span className="text-gray-500">/{liga.slug}</span>
                            </li>
                        ))}
                    </ul>
                )}

                <form onSubmit={onCrearLiga} className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="liga-nombre" className="text-sm text-gray-300">Nombre</label>
                        <input
                            id="liga-nombre"
                            value={ligaNombre}
                            onChange={(e) => setLigaNombre(e.target.value)}
                            className={inputClass}
                            placeholder="Ej. LDT SHADOWS"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="liga-slug" className="text-sm text-gray-300">
                            Slug (va en la URL)
                        </label>
                        <input
                            id="liga-slug"
                            value={ligaSlug}
                            onChange={(e) => setLigaSlug(e.target.value.toLowerCase())}
                            className={inputClass}
                            placeholder="Ej. shadows"
                        />
                    </div>
                    <button type="submit" disabled={guardando} className={botonPrimario}>
                        Crear liga
                    </button>
                </form>
            </section>

            {/* ======================= 2. TEMPORADAS ======================= */}
            <section className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">2 · Temporadas</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Cada liga puede tener <strong>una sola</strong> temporada en curso. Crea la
                        siguiente en &quot;Inscripciones&quot; para prepararla sin cerrar la actual.
                    </p>
                </div>

                <form onSubmit={onCrearTemporada} className="flex flex-wrap items-end gap-3">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="temp-liga" className="text-sm text-gray-300">Liga</label>
                        <select
                            id="temp-liga"
                            value={temporadaLiga}
                            onChange={(e) => elegirLigaParaTemporada(e.target.value)}
                            className={inputClass}
                        >
                            <option value="">Elige una liga</option>
                            {ligas.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="temp-numero" className="text-sm text-gray-300">Número</label>
                        <input
                            id="temp-numero"
                            type="number"
                            min={1}
                            value={temporadaNumero}
                            onChange={(e) => setTemporadaNumero(e.target.value)}
                            className={`${inputClass} w-24`}
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="temp-estado" className="text-sm text-gray-300">Estado</label>
                        <select
                            id="temp-estado"
                            value={temporadaEstado}
                            onChange={(e) => setTemporadaEstado(e.target.value as SeasonStatus)}
                            className={inputClass}
                        >
                            {seasonStatuses.map((s) => (
                                <option key={s} value={s}>{etiquetaEstado[s]}</option>
                            ))}
                        </select>
                    </div>
                    <button type="submit" disabled={guardando} className={botonPrimario}>
                        Crear temporada
                    </button>
                </form>

                {ligas.map((liga) =>
                    liga.seasons.length === 0 ? null : (
                        <div key={liga.id} className="space-y-2">
                            <h3 className="font-semibold text-gray-200">{liga.name}</h3>
                            <ul className="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800">
                                {liga.seasons.map((s) => {
                                    const nombre = nombreTemporada(liga, s.number);
                                    return (
                                        <li
                                            key={s.id}
                                            className="flex flex-wrap items-center justify-between gap-3 bg-gray-950/40 px-4 py-3"
                                        >
                                            <span className="flex items-center gap-3">
                                                <Link
                                                    href={urlTemporada(liga, s.number)}
                                                    className="font-semibold text-white hover:text-pink-400"
                                                >
                                                    Temporada {romano(s.number)}
                                                </Link>
                                                <span className={`rounded-full border px-2 py-0.5 text-xs ${claseEstado[s.status]}`}>
                                                    {etiquetaEstado[s.status]}
                                                </span>
                                                <span className="text-sm text-gray-500">
                                                    {s._count.teamSeasons}{' '}
                                                    {s._count.teamSeasons === 1 ? 'equipo' : 'equipos'}
                                                </span>
                                            </span>

                                            <span className="flex items-center gap-2">
                                                <label className="sr-only" htmlFor={`estado-${s.id}`}>
                                                    Estado de {nombre}
                                                </label>
                                                <select
                                                    id={`estado-${s.id}`}
                                                    value={s.status}
                                                    disabled={guardando}
                                                    onChange={(e) =>
                                                        onCambiarEstado(s.id, e.target.value as SeasonStatus, nombre)
                                                    }
                                                    className={`${inputClass} py-1 text-sm`}
                                                >
                                                    {seasonStatuses.map((st) => (
                                                        <option key={st} value={st}>{etiquetaEstado[st]}</option>
                                                    ))}
                                                </select>
                                                {/* Solo una temporada vacía se puede borrar. */}
                                                {s._count.teamSeasons === 0 && (
                                                    <button
                                                        type="button"
                                                        disabled={guardando}
                                                        onClick={() => onEliminarTemporada(s.id, nombre)}
                                                        className="rounded-full border border-red-500/60 px-3 py-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                                                    >
                                                        Eliminar
                                                    </button>
                                                )}
                                            </span>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ),
                )}
            </section>

            {/* ======================= 3. INSCRIPCIONES ======================= */}
            <section className="space-y-4 rounded-lg border border-pink-500/30 bg-gray-900/40 p-6">
                <div>
                    <h2 className="text-xl font-semibold text-white">3 · Equipos inscritos</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Un equipo inscrito llega <strong>sin plantel y con estadísticas en cero</strong>:
                        todo lo &quot;de la temporada&quot; empieza de nuevo. El nombre y el logo ya los trae.
                    </p>
                </div>

                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} idPrefix="insc" />

                {elegida && temporadaCerrada && (
                    <p className="rounded-md border border-gray-700 bg-gray-950/60 p-3 text-sm text-gray-400">
                        {nombreTemporada(elegida.liga, elegida.temporada.number)} está cerrada: no se
                        pueden inscribir equipos ni agregar jugadores. Las estadísticas sí se pueden corregir.
                    </p>
                )}

                {elegida && !temporadaCerrada && (
                    <form onSubmit={onInscribir} className="flex flex-wrap items-end gap-3">
                        <div className="flex flex-col gap-1">
                            <label htmlFor="insc-equipo" className="text-sm text-gray-300">Equipo</label>
                            <select
                                id="insc-equipo"
                                value={inscribirEquipo}
                                onChange={(e) => setInscribirEquipo(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Elige un equipo</option>
                                {equipos.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="flex flex-col gap-1">
                            <label htmlFor="insc-categoria" className="text-sm text-gray-300">Categoría</label>
                            <select
                                id="insc-categoria"
                                value={inscribirCategoria}
                                onChange={(e) => setInscribirCategoria(e.target.value as TeamCategory)}
                                className={inputClass}
                            >
                                {teamCategories.map((c) => (
                                    <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                                ))}
                            </select>
                        </div>
                        <button type="submit" disabled={guardando} className={botonPrimario}>
                            Inscribir
                        </button>
                        <Link href="/manejar-equipos" className="pb-2 text-sm text-pink-500 hover:text-pink-400">
                            ¿Equipo nuevo? Créalo aquí
                        </Link>
                    </form>
                )}

                {cargandoInscripciones && <p className="text-gray-300">Cargando equipos inscritos...</p>}

                {!cargandoInscripciones && elegida && inscripciones.length === 0 && (
                    <p className="text-gray-400">Todavía no hay equipos inscritos en esta temporada.</p>
                )}

                {!cargandoInscripciones && inscripciones.length > 0 && (
                    <ul className="space-y-3">
                        {inscripciones.map((inscripcion) => (
                            <InscripcionFila
                                key={inscripcion.id}
                                inscripcion={inscripcion}
                                cerrada={temporadaCerrada}
                                onCambio={async () => {
                                    await recargar();
                                    await cargarInscripciones();
                                }}
                            />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
