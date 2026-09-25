'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Modal from '@/components/modal';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria, inputClass } from '@/lib/team-ui';
import { nombreTemporada, urlTemporada, type TeamSeason, type ListTeamSeasonsResponse } from '@/lib/season-ui';
import {
    agruparPorJornada,
    etiquetaEstadoPartido,
    claseEstadoPartido,
    formatoFechaPartido,
    formatoDiaPartido,
    formatoHoraPartido,
    type Game,
    type Venue,
    type ListGamesResponse,
    type ListVenuesResponse,
} from '@/lib/game-ui';
import SedesSeccion from './sedes-seccion';
import PartidoForm, { type DatosPartido } from './partido-form';
import MarcadorModal from './marcador-modal';

/**
 * Panel de administración de partidos. Tres secciones:
 *
 *   1. Sedes         → registrar dónde se juega (una vez)
 *   2. Nuevo partido → armar el rol de la temporada elegida
 *   3. El rol        → los partidos agrupados por jornada, con sus acciones:
 *                      resultado (modal), editar (modal), suspender, borrar
 *
 * Todo lo que escribe pasa por `ejecutar`, igual que en /manejar-temporadas:
 * toast de éxito o de error y recarga de lo que haya cambiado.
 */
export default function PartidosPanel() {
    const { ligas, cargando, error, seasonId, setSeasonId, elegida } = useLigas();

    const [sedes, setSedes] = useState<Venue[]>([]);
    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [partidos, setPartidos] = useState<Game[]>([]);
    const [cargandoTemporada, setCargandoTemporada] = useState(false);
    const [guardando, setGuardando] = useState(false);

    // Filtro del rol por categoría ('' = todas). Se filtra en el navegador:
    // los partidos de la temporada ya están cargados.
    const [filtroElegido, setFiltro] = useState<TeamCategory | ''>('');

    // Modales abiertos. null = cerrado. Se guarda el partido COMPLETO para
    // que el modal pinte los nombres sin volver a pedirlos.
    const [editando, setEditando] = useState<Game | null>(null);
    const [conMarcador, setConMarcador] = useState<Game | null>(null);

    const cargarSedes = useCallback(async () => {
        try {
            const resp = await trpcQuery<ListVenuesResponse>('listVenues');
            setSedes(resp.data.venues);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        }
    }, []);

    const cargarTemporada = useCallback(async () => {
        if (!seasonId) {
            setInscripciones([]);
            setPartidos([]);
            return;
        }
        setCargandoTemporada(true);
        try {
            const [respInscripciones, respPartidos] = await Promise.all([
                trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', { seasonId }),
                trpcQuery<ListGamesResponse>('listGames', { seasonId }),
            ]);
            setInscripciones(respInscripciones.data.teamSeasons);
            setPartidos(respPartidos.data.games);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargandoTemporada(false);
        }
    }, [seasonId]);

    useEffect(() => {
        cargarSedes();
    }, [cargarSedes]);

    useEffect(() => {
        cargarTemporada();
    }, [cargarTemporada]);

    // Las sedes también se recargan: su conteo de partidos cambia al crear o borrar.
    const recargarTodo = useCallback(async () => {
        await Promise.all([cargarSedes(), cargarTemporada()]);
    }, [cargarSedes, cargarTemporada]);

    const ejecutar = useCallback(
        async (accion: () => Promise<unknown>, exito: string) => {
            setGuardando(true);
            try {
                await accion();
                toast.success(exito);
                await recargarTodo();
                return true;
            } catch (err) {
                toast.error(err instanceof Error ? err.message : 'Error desconocido');
                return false;
            } finally {
                setGuardando(false);
            }
        },
        [recargarTodo],
    );

    // ---------- Sedes ----------
    const onCrearSede = (datos: { name: string; address: string | null }) =>
        ejecutar(() => trpcMutation('createVenue', datos), `Sede ${datos.name} registrada`);

    const onEliminarSede = (sede: Venue) =>
        ejecutar(() => trpcMutation('deleteVenue', { id: sede.id }), `Sede ${sede.name} eliminada`);

    // ---------- Partidos ----------
    const onCrearPartido = (datos: DatosPartido) =>
        ejecutar(() => trpcMutation('createGame', { seasonId, ...datos }), 'Partido agregado al rol');

    const onEditarPartido = async (datos: DatosPartido) => {
        if (!editando) return false;
        const ok = await ejecutar(() => trpcMutation('updateGame', { id: editando.id, ...datos }), 'Partido actualizado');
        if (ok) setEditando(null);
        return ok;
    };

    const onSuspender = (p: Game) =>
        ejecutar(
            () => trpcMutation('updateGame', { id: p.id, status: p.status === 'suspendido' ? 'programado' : 'suspendido' }),
            p.status === 'suspendido' ? 'Partido reactivado' : 'Partido suspendido',
        );

    const onBorrar = (p: Game) => ejecutar(() => trpcMutation('deleteGame', { id: p.id }), 'Partido borrado');

    if (cargando) return <p className="text-gray-300">Cargando ligas...</p>;
    if (error) return <p className="text-red-400">Error: {error}</p>;

    const temporadaCerrada = elegida?.temporada.status === 'cerrada';
    const categorias = elegida?.temporada.categories ?? [];
    const filtro: TeamCategory | '' = filtroElegido && categorias.includes(filtroElegido) ? filtroElegido : '';
    const visibles = filtro ? partidos.filter((p) => p.homeTeamSeason.category === filtro) : partidos;
    const grupos = agruparPorJornada(visibles);

    return (
        <div className="space-y-10">
            {/* ======================= 1. SEDES ======================= */}
            <section className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-6">
                <h2 className="text-xl font-semibold text-white">1 · Sedes</h2>
                <SedesSeccion sedes={sedes} guardando={guardando} onCrear={onCrearSede} onEliminar={onEliminarSede} />
            </section>

            {/* ======================= TEMPORADA ======================= */}
            <div className="space-y-2">
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} idPrefix="partidos" />
                {elegida && (
                    <p className="text-sm text-gray-500">
                        Trabajando en{' '}
                        <Link
                            href={urlTemporada(elegida.liga, elegida.temporada.number)}
                            className="font-semibold text-pink-400 hover:text-pink-300"
                        >
                            {nombreTemporada(elegida.liga, elegida.temporada.number)}
                        </Link>
                    </p>
                )}
                {elegida && temporadaCerrada && (
                    <p className="rounded-md border border-gray-700 bg-gray-950/60 p-3 text-sm text-gray-400">
                        Esta temporada está cerrada: sus partidos ya no se crean, editan ni capturan.
                    </p>
                )}
            </div>

            {/* ======================= 2. NUEVO PARTIDO ======================= */}
            {elegida && !temporadaCerrada && (
                <section className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-6">
                    <h2 className="text-xl font-semibold text-white">2 · Nuevo partido</h2>
                    <PartidoForm
                        inscripciones={inscripciones}
                        partidos={partidos}
                        categorias={categorias}
                        sedes={sedes}
                        textoBoton="Agregar al rol"
                        guardando={guardando}
                        onEnviar={onCrearPartido}
                    />
                </section>
            )}

            {/* ======================= 3. EL ROL ======================= */}
            {elegida && (
                <section className="space-y-4 rounded-lg border border-pink-500/30 bg-gray-900/40 p-6">
                    <div className="flex flex-wrap items-end justify-between gap-3">
                        <h2 className="text-xl font-semibold text-white">3 · El rol</h2>
                        {categorias.length > 1 && (
                            <div className="flex flex-col gap-1">
                                <label htmlFor="rol-filtro" className="text-sm text-gray-300">Categoría</label>
                                <select
                                    id="rol-filtro"
                                    value={filtro}
                                    onChange={(e) => setFiltro(e.target.value as TeamCategory | '')}
                                    className={`${inputClass} py-1 text-sm`}
                                >
                                    <option value="">Todas</option>
                                    {categorias.map((c) => (
                                        <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                    </div>

                    {cargandoTemporada && <p className="text-gray-300">Cargando partidos...</p>}

                    {!cargandoTemporada && grupos.length === 0 && (
                        <p className="text-gray-400">Todavía no hay partidos en esta temporada.</p>
                    )}

                    {!cargandoTemporada &&
                        grupos.map((grupo) => (
                            <div key={grupo.clave} className="space-y-2">
                                <h3 className="font-semibold text-gray-200">
                                    {grupo.titulo}
                                    {/* Si toda la jornada es el mismo día, se dice UNA vez aquí
                                        y cada fila muestra solo la hora. */}
                                    {grupo.diaComun && (
                                        <span className="font-normal text-gray-400">
                                            {' '}· {formatoDiaPartido(grupo.diaComun)}
                                        </span>
                                    )}
                                </h3>
                                <ul className="space-y-2">
                                    {grupo.partidos.map((p) => (
                                        <FilaPartido
                                            key={p.id}
                                            partido={p}
                                            soloHora={grupo.diaComun !== null}
                                            acciones={!temporadaCerrada}
                                            guardando={guardando}
                                            onResultado={() => setConMarcador(p)}
                                            onEditar={() => setEditando(p)}
                                            onSuspender={() => onSuspender(p)}
                                            onBorrar={() => onBorrar(p)}
                                        />
                                    ))}
                                </ul>
                            </div>
                        ))}
                </section>
            )}

            {/* ======================= MODALES ======================= */}
            <Modal
                abierto={editando !== null}
                onCerrar={() => setEditando(null)}
                titulo="Editar partido"
                subtitulo={editando ? `${editando.homeTeamSeason.team.name} vs ${editando.awayTeamSeason.team.name}` : undefined}
            >
                {editando && (
                    <PartidoForm
                        key={editando.id}
                        idPrefix="editar"
                        inicial={editando}
                        inscripciones={inscripciones}
                        partidos={partidos}
                        categorias={categorias}
                        sedes={sedes}
                        textoBoton="Guardar cambios"
                        guardando={guardando}
                        onEnviar={onEditarPartido}
                    />
                )}
            </Modal>

            {conMarcador && (
                <MarcadorModal
                    key={conMarcador.id}
                    partido={conMarcador}
                    onCerrar={() => setConMarcador(null)}
                    onCambio={recargarTodo}
                />
            )}
        </div>
    );
}

/** Un partido del rol. Las acciones cambian según su estado. */
function FilaPartido({
    partido: p,
    soloHora,
    acciones,
    guardando,
    onResultado,
    onEditar,
    onSuspender,
    onBorrar,
}: {
    partido: Game;
    /** true si el día ya está en el encabezado de la jornada. */
    soloHora: boolean;
    /** false si la temporada está cerrada: solo se muestra. */
    acciones: boolean;
    guardando: boolean;
    onResultado: () => void;
    onEditar: () => void;
    onSuspender: () => void;
    onBorrar: () => void;
}) {
    const finalizado = p.status === 'finalizado';
    const boton = 'rounded-full border px-3 py-1 text-xs transition disabled:opacity-50';

    return (
        <li className="space-y-2 rounded-lg border border-gray-800 bg-gray-950/40 px-4 py-3">
            <div className="flex flex-wrap items-center gap-2 text-xs text-gray-400">
                <span className="text-gray-300">
                    {soloHora ? formatoHoraPartido(p.scheduledAt) : formatoFechaPartido(p.scheduledAt)}
                </span>
                <span>· {p.venue.name}{p.field != null ? `, campo ${p.field}` : ''}</span>
                <span className="rounded-full border border-gray-700 px-2 py-0.5">
                    {etiquetaCategoria[p.homeTeamSeason.category]}
                </span>
                <span className={`rounded-full border px-2 py-0.5 ${claseEstadoPartido[p.status]}`}>
                    {etiquetaEstadoPartido[p.status]}
                </span>
                {p.isForfeit && (
                    <span className="rounded-full border border-yellow-500/40 px-2 py-0.5 text-yellow-300">Default</span>
                )}
            </div>

            <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-3">
                <span className="truncate text-right font-semibold text-white">{p.homeTeamSeason.team.name}</span>
                <span className="min-w-16 text-center font-bold text-white">
                    {finalizado ? `${p.homeScore} – ${p.awayScore}` : <span className="text-gray-500">vs</span>}
                </span>
                <span className="truncate font-semibold text-white">{p.awayTeamSeason.team.name}</span>
            </div>

            {p.notes && <p className="text-sm text-gray-400">{p.notes}</p>}

            {acciones && (
                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        disabled={guardando}
                        onClick={onResultado}
                        className={`${boton} border-pink-500/60 text-pink-300 hover:text-pink-200`}
                    >
                        {finalizado ? 'Resultado' : 'Capturar resultado'}
                    </button>
                    {/* Un finalizado no se edita ni se borra: primero se deshace su resultado. */}
                    {!finalizado && (
                        <>
                            <button
                                type="button"
                                disabled={guardando}
                                onClick={onEditar}
                                className={`${boton} border-gray-600 text-gray-300 hover:text-white`}
                            >
                                Editar / reprogramar
                            </button>
                            <button
                                type="button"
                                disabled={guardando}
                                onClick={onSuspender}
                                className={`${boton} border-yellow-500/60 text-yellow-300 hover:text-yellow-200`}
                            >
                                {p.status === 'suspendido' ? 'Reactivar' : 'Suspender'}
                            </button>
                            <button
                                type="button"
                                disabled={guardando}
                                onClick={onBorrar}
                                className={`${boton} border-red-500/60 text-red-400 hover:text-red-300`}
                            >
                                Borrar
                            </button>
                        </>
                    )}
                </div>
            )}
        </li>
    );
}
