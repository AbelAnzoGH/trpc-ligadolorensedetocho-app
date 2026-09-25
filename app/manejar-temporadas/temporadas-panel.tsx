'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import type { TeamCategory } from '@/lib/team-schema';
import { seasonStatuses, type SeasonStatus } from '@/lib/season-schema';
import { etiquetaCategoria, type Team, type ListTeamsResponse } from '@/lib/team-ui';
import {
    romano,
    nombreTemporada,
    urlTemporada,
    etiquetaEstado,
    tonoEstadoTemporada,
    type TeamSeason,
    type ListTeamSeasonsResponse,
} from '@/lib/season-ui';
import { cn } from '@/lib/cn';
import Boton from '@/components/ui/boton';
import Insignia from '@/components/ui/insignia';
import Tarjeta from '@/components/ui/tarjeta';
import { TituloSeccion } from '@/components/ui/pagina';
import { Cargando, MensajeError, Nota, Vacio } from '@/components/ui/estado';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseEnlace } from '@/components/ui/enlace';
import { claseAccionesFila, claseFila, claseLista } from '@/components/ui/lista';
import InscripcionFila from './inscripcion-fila';
import CategoriasTemporada from './categorias-temporada';

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
    // Empieza vacía a propósito: el admin elige qué categorías se juegan.
    const [temporadaCategorias, setTemporadaCategorias] = useState<TeamCategory[]>([]);

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
        if (temporadaCategorias.length === 0) {
            toast.error('Elige al menos una categoría');
            return;
        }
        const numero = Number(temporadaNumero);
        const ok = await ejecutar(
            () =>
                trpcMutation('createSeason', {
                    leagueId: liga.id,
                    number: numero,
                    status: temporadaEstado,
                    categories: temporadaCategorias,
                }),
            `${nombreTemporada(liga, numero)} creada`,
        );
        if (ok) {
            setTemporadaLiga('');
            setTemporadaNumero('');
            setTemporadaEstado('inscripciones');
            setTemporadaCategorias([]);
        }
    };

    const onCambiarEstado = (id: string, status: SeasonStatus, nombre: string) =>
        ejecutar(() => trpcMutation('updateSeason', { id, status }), `${nombre}: ${etiquetaEstado[status]}`);

    const onCambiarCategorias = (id: string, categories: TeamCategory[], nombre: string) => {
        if (categories.length === 0) {
            toast.error('La temporada debe tener al menos una categoría');
            return;
        }
        return ejecutar(() => trpcMutation('updateSeason', { id, categories }), `${nombre}: categorías actualizadas`);
    };

    const onEliminarTemporada = (id: string, nombre: string) =>
        ejecutar(() => trpcMutation('deleteSeason', { id }), `${nombre} eliminada`);

    // ======================= 3. INSCRIPCIONES =======================
    const [equipos, setEquipos] = useState<Team[]>([]);
    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [cargandoInscripciones, setCargandoInscripciones] = useState(false);
    const [inscribirEquipo, setInscribirEquipo] = useState('');
    const [inscribirCategoria, setInscribirCategoria] = useState<TeamCategory | ''>('');

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
        if (!inscribirEquipo || !categoriaInscripcion) {
            toast.error('Elige un equipo y una categoría');
            return;
        }
        const ok = await ejecutar(
            () =>
                trpcMutation('enrollTeam', {
                    seasonId,
                    teamId: inscribirEquipo,
                    category: categoriaInscripcion,
                }),
            'Equipo inscrito',
            cargarInscripciones,
        );
        if (ok) setInscribirEquipo('');
    };

    if (cargando) return <Cargando texto="Cargando ligas…" />;
    if (error) return <MensajeError>Error: {error}</MensajeError>;

    const temporadaCerrada = elegida?.temporada.status === 'cerrada';

    // Solo se ofrecen las categorías que la temporada elegida tiene. Si la
    // que estaba seleccionada no existe en esta temporada (se cambió de
    // temporada), se usa la primera disponible. Es un valor DERIVADO: se
    // calcula en cada render en vez de "sincronizarlo" con un useEffect.
    const categoriasTemporada = elegida?.temporada.categories ?? [];
    const categoriaInscripcion: TeamCategory | '' =
        inscribirCategoria && categoriasTemporada.includes(inscribirCategoria)
            ? inscribirCategoria
            : (categoriasTemporada[0] ?? '');

    return (
        <div className="space-y-8">
            {/* ======================= 1. LIGAS ======================= */}
            <Tarjeta variante="panel" as="section" className="space-y-5">
                <TituloSeccion paso={1}>Ligas</TituloSeccion>

                {ligas.length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                        {ligas.map((liga) => (
                            <li key={liga.id}>
                                <Insignia tono="contorno" className="text-meta">
                                    <span className="text-tinta">{liga.name}</span>
                                    <span className="font-normal text-tenue">/{liga.slug}</span>
                                </Insignia>
                            </li>
                        ))}
                    </ul>
                )}

                <form onSubmit={onCrearLiga} className="flex flex-wrap items-end gap-3">
                    <div className={claseGrupoCampo}>
                        <label htmlFor="liga-nombre" className={claseEtiqueta}>Nombre</label>
                        <input
                            id="liga-nombre"
                            value={ligaNombre}
                            onChange={(e) => setLigaNombre(e.target.value)}
                            className={`${claseCampo} min-w-56`}
                            placeholder="Ej. LDT SHADOWS"
                        />
                    </div>
                    <div className={claseGrupoCampo}>
                        <label htmlFor="liga-slug" className={claseEtiqueta}>
                            Slug <span className="font-normal text-tenue">(va en la URL)</span>
                        </label>
                        <input
                            id="liga-slug"
                            value={ligaSlug}
                            onChange={(e) => setLigaSlug(e.target.value.toLowerCase())}
                            className={`${claseCampo} min-w-40`}
                            placeholder="Ej. shadows"
                        />
                    </div>
                    <Boton type="submit" disabled={guardando}>
                        Crear liga
                    </Boton>
                </form>
            </Tarjeta>

            {/* ======================= 2. TEMPORADAS ======================= */}
            <Tarjeta variante="panel" as="section" className="space-y-6">
                <TituloSeccion
                    paso={2}
                    descripcion={
                        <>
                            Cada liga puede tener <strong className="font-semibold text-tinta-2">una sola</strong>{' '}
                            temporada en curso. Crea la siguiente en &quot;Inscripciones&quot; para prepararla sin
                            cerrar la actual.
                        </>
                    }
                >
                    Temporadas
                </TituloSeccion>

                <form onSubmit={onCrearTemporada} className="flex flex-wrap items-end gap-3">
                    <div className={claseGrupoCampo}>
                        <label htmlFor="temp-liga" className={claseEtiqueta}>Liga</label>
                        <select
                            id="temp-liga"
                            value={temporadaLiga}
                            onChange={(e) => elegirLigaParaTemporada(e.target.value)}
                            className={`${claseCampo} min-w-40`}
                        >
                            <option value="">Elige una liga</option>
                            {ligas.map((l) => (
                                <option key={l.id} value={l.id}>{l.name}</option>
                            ))}
                        </select>
                    </div>
                    <div className={claseGrupoCampo}>
                        <label htmlFor="temp-numero" className={claseEtiqueta}>Número</label>
                        <input
                            id="temp-numero"
                            type="number"
                            min={1}
                            value={temporadaNumero}
                            onChange={(e) => setTemporadaNumero(e.target.value)}
                            className={`${claseCampo} w-24`}
                        />
                    </div>
                    <div className={`${claseGrupoCampo} w-full sm:order-last`}>
                        <span className={claseEtiqueta}>Categorías que se juegan</span>
                        <CategoriasTemporada
                            seleccionadas={temporadaCategorias}
                            onCambiar={setTemporadaCategorias}
                            deshabilitado={guardando}
                        />
                    </div>
                    <div className={claseGrupoCampo}>
                        <label htmlFor="temp-estado" className={claseEtiqueta}>Estado</label>
                        <select
                            id="temp-estado"
                            value={temporadaEstado}
                            onChange={(e) => setTemporadaEstado(e.target.value as SeasonStatus)}
                            className={`${claseCampo} min-w-40`}
                        >
                            {seasonStatuses.map((s) => (
                                <option key={s} value={s}>{etiquetaEstado[s]}</option>
                            ))}
                        </select>
                    </div>
                    <Boton type="submit" disabled={guardando}>
                        Crear temporada
                    </Boton>
                </form>

                {ligas.map((liga) =>
                    liga.seasons.length === 0 ? null : (
                        <div key={liga.id} className="space-y-3">
                            <h3 className="text-leyenda font-medium uppercase tracking-wider text-tenue">{liga.name}</h3>
                            <ul className={claseLista}>
                                {liga.seasons.map((s) => {
                                    const nombre = nombreTemporada(liga, s.number);
                                    return (
                                        <li key={s.id} className={claseFila}>
                                            <span className="flex flex-wrap items-center gap-3">
                                                <Link href={urlTemporada(liga, s.number)} className={claseEnlace}>
                                                    Temporada {romano(s.number)}
                                                </Link>
                                                <Insignia tono={tonoEstadoTemporada[s.status]}>
                                                    {etiquetaEstado[s.status]}
                                                </Insignia>
                                                <span className="text-meta text-tenue">
                                                    {s._count.teamSeasons}{' '}
                                                    {s._count.teamSeasons === 1 ? 'equipo' : 'equipos'}
                                                </span>
                                            </span>

                                            <span className={`${claseAccionesFila} items-center`}>
                                                <label className="sr-only" htmlFor={`estado-${s.id}`}>
                                                    Estado de {nombre}
                                                </label>
                                                {/* h-8: a la altura de los botones sm de la fila. */}
                                                <select
                                                    id={`estado-${s.id}`}
                                                    value={s.status}
                                                    disabled={guardando}
                                                    onChange={(e) =>
                                                        onCambiarEstado(s.id, e.target.value as SeasonStatus, nombre)
                                                    }
                                                    className={cn(claseCampo, 'h-8 py-0 text-meta')}
                                                >
                                                    {seasonStatuses.map((st) => (
                                                        <option key={st} value={st}>{etiquetaEstado[st]}</option>
                                                    ))}
                                                </select>
                                                {/* Solo una temporada vacía se puede borrar. */}
                                                {s._count.teamSeasons === 0 && (
                                                    <Boton
                                                        variante="peligro"
                                                        tamano="sm"
                                                        disabled={guardando}
                                                        onClick={() => onEliminarTemporada(s.id, nombre)}
                                                    >
                                                        Eliminar
                                                    </Boton>
                                                )}
                                            </span>

                                            <div className="w-full">
                                                <CategoriasTemporada
                                                    seleccionadas={s.categories}
                                                    deshabilitado={guardando || s.status === 'cerrada'}
                                                    onCambiar={(nuevas) => onCambiarCategorias(s.id, nuevas, nombre)}
                                                />
                                            </div>
                                        </li>
                                    );
                                })}
                            </ul>
                        </div>
                    ),
                )}
            </Tarjeta>

            {/* ======================= 3. INSCRIPCIONES ======================= */}
            {/* Bloque "activo": trabaja sobre la temporada que se elija aquí. */}
            <Tarjeta variante="panel" as="section" className="space-y-5 border-borde-fuerte">
                <TituloSeccion
                    paso={3}
                    descripcion={
                        <>
                            Un equipo inscrito llega{' '}
                            <strong className="font-semibold text-tinta-2">sin plantel y con estadísticas en cero</strong>:
                            todo lo &quot;de la temporada&quot; empieza de nuevo. El nombre y el logo ya los trae.
                        </>
                    }
                >
                    Equipos inscritos
                </TituloSeccion>

                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} idPrefix="insc" />

                {elegida && temporadaCerrada && (
                    <Nota>
                        {nombreTemporada(elegida.liga, elegida.temporada.number)} está cerrada: no se pueden
                        inscribir equipos ni agregar jugadores. Las estadísticas sí se pueden corregir.
                    </Nota>
                )}

                {elegida && !temporadaCerrada && (
                    <form onSubmit={onInscribir} className="flex flex-wrap items-end gap-3">
                        <div className={claseGrupoCampo}>
                            <label htmlFor="insc-equipo" className={claseEtiqueta}>Equipo</label>
                            <select
                                id="insc-equipo"
                                value={inscribirEquipo}
                                onChange={(e) => setInscribirEquipo(e.target.value)}
                                className={`${claseCampo} min-w-48`}
                            >
                                <option value="">Elige un equipo</option>
                                {equipos.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className={claseGrupoCampo}>
                            <label htmlFor="insc-categoria" className={claseEtiqueta}>Categoría</label>
                            <select
                                id="insc-categoria"
                                value={categoriaInscripcion}
                                onChange={(e) => setInscribirCategoria(e.target.value as TeamCategory)}
                                disabled={categoriasTemporada.length === 0}
                                className={`${claseCampo} min-w-40`}
                            >
                                {categoriasTemporada.length === 0 && (
                                    <option value="">Sin categorías: agrégalas en la sección 2</option>
                                )}
                                {categoriasTemporada.map((c) => (
                                    <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                                ))}
                            </select>
                        </div>
                        <Boton type="submit" disabled={guardando}>
                            Inscribir
                        </Boton>
                        {/* pb-2.5: el texto queda a la altura del texto de los campos. */}
                        <Link href="/manejar-equipos" className={`${claseEnlace} pb-2.5 text-meta`}>
                            ¿Equipo nuevo? Créalo aquí
                        </Link>
                    </form>
                )}

                {cargandoInscripciones && <Cargando texto="Cargando equipos inscritos…" />}

                {!cargandoInscripciones && elegida && inscripciones.length === 0 && (
                    <Vacio>Todavía no hay equipos inscritos en esta temporada.</Vacio>
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
            </Tarjeta>
        </div>
    );
}
