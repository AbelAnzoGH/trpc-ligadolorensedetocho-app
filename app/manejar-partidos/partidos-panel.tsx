'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Modal from '@/components/modal';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import Boton from '@/components/ui/boton';
import { useConfirmar } from '@/components/use-confirmar';
import Tarjeta from '@/components/ui/tarjeta';
import { TituloSeccion } from '@/components/ui/pagina';
import { Cargando, MensajeError, Nota, Vacio } from '@/components/ui/estado';
import { claseCampo } from '@/components/ui/campo';
import { claseEnlace } from '@/components/ui/enlace';
import { nombreTemporada, urlTemporada, type TeamSeason, type ListTeamSeasonsResponse } from '@/lib/season-ui';
import PartidoTarjeta from '@/components/partido-tarjeta';
import {
    agruparPorCategoria,
    agruparPorJornada,
    type Game,
    type Venue,
    type ListGamesResponse,
    type ListVenuesResponse,
} from '@/lib/game-ui';
import SedesSeccion from './sedes-seccion';
import PartidoForm, { type DatosPartido } from './partido-form';
import MarcadorModal from './marcador-modal';
import JornadaGrupo from './jornada-grupo';

/** Misma clave que usa agruparPorJornada (lib/game-ui.ts) para identificar un grupo. */
const claveDeGrupo = (p: Game) => (p.round != null ? `jornada-${p.round}` : `fase-${p.phase}`);

/**
 * Qué jornada se abre sola al entrar a una temporada: la del partido más
 * reciente cuya fecha ya pasó (el mismo criterio de "última jornada jugada"
 * de la portada). Si todavía no se juega nada, la del primer partido.
 */
const claveInicial = (partidos: Game[]): string | null => {
    if (partidos.length === 0) return null;
    const ahora = Date.now();
    const tiempo = (p: Game) => new Date(p.scheduledAt).getTime();
    const pasados = partidos.filter((p) => tiempo(p) <= ahora);
    const referencia = pasados.length
        ? pasados.reduce((a, b) => (tiempo(b) > tiempo(a) ? b : a))
        : partidos.reduce((a, b) => (tiempo(b) < tiempo(a) ? b : a));
    return claveDeGrupo(referencia);
};

/**
 * Panel de administración de partidos. Tres secciones:
 *
 *   1. Sedes         → registrar dónde se juega (una vez)
 *   2. Nuevo partido → armar el rol de la temporada elegida
 *   3. El rol        → los partidos en jornadas colapsables (la más reciente
 *                      primero), separados por categoría dentro de cada una,
 *                      con sus acciones: resultado (modal), editar (modal),
 *                      suspender, borrar
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
    const { confirmar, modalConfirmar } = useConfirmar();

    // Filtro del rol por categoría ('' = todas). Se filtra en el navegador:
    // los partidos de la temporada ya están cargados.
    const [filtroElegido, setFiltro] = useState<TeamCategory | ''>('');

    // Jornadas abiertas del rol, por su clave. Se guarda junto con la
    // temporada a la que pertenecen: al cambiar de temporada se vuelve a
    // sembrar con la jornada que toca, y al RECARGAR la misma (después de
    // capturar un marcador) se conservan tal como el usuario las dejó.
    const [abiertas, setAbiertas] = useState<{ temporada: string; claves: Set<string> }>({
        temporada: '',
        claves: new Set(),
    });

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
            setAbiertas((previas) => {
                if (previas.temporada === seasonId) return previas;
                const inicial = claveInicial(respPartidos.data.games);
                return { temporada: seasonId, claves: new Set(inicial ? [inicial] : []) };
            });
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

    const onEliminarSede = async (sede: Venue) => {
        const ok = await confirmar({
            titulo: 'Eliminar sede',
            mensaje: (
                <>
                    ¿Estás seguro de que quieres eliminar la sede <strong className="text-tinta">{sede.name}</strong>?
                </>
            ),
        });
        if (!ok) return;
        await ejecutar(() => trpcMutation('deleteVenue', { id: sede.id }), `Sede ${sede.name} eliminada`);
    };

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

    const onBorrar = async (p: Game) => {
        const ok = await confirmar({
            titulo: 'Borrar partido',
            mensaje: (
                <>
                    ¿Estás seguro de que quieres borrar el partido{' '}
                    <strong className="text-tinta">
                        {p.homeTeamSeason.team.name} vs {p.awayTeamSeason.team.name}
                    </strong>
                    ?
                </>
            ),
            textoConfirmar: 'Borrar',
        });
        if (!ok) return;
        await ejecutar(() => trpcMutation('deleteGame', { id: p.id }), 'Partido borrado');
    };

    if (cargando) return <Cargando texto="Cargando ligas…" />;
    if (error) return <MensajeError>Error: {error}</MensajeError>;

    const temporadaCerrada = elegida?.temporada.status === 'cerrada';
    // Los marcadores solo se capturan / corrigen con la temporada ACTIVA.
    const puedeCapturar = elegida?.temporada.status === 'activa';
    const categorias = elegida?.temporada.categories ?? [];
    const filtro: TeamCategory | '' = filtroElegido && categorias.includes(filtroElegido) ? filtroElegido : '';
    const visibles = filtro ? partidos.filter((p) => p.homeTeamSeason.category === filtro) : partidos;
    // La jornada más reciente arriba. Los grupos sin jornada (amistosos,
    // pretemporada, playoffs) van al final, en el orden que traen.
    const todosLosGrupos = agruparPorJornada(visibles);
    const numeroJornada = (g: (typeof todosLosGrupos)[number]) => g.partidos[0].round;
    const grupos = [
        ...todosLosGrupos.filter((g) => numeroJornada(g) != null).sort((a, b) => numeroJornada(b)! - numeroJornada(a)!),
        ...todosLosGrupos.filter((g) => numeroJornada(g) == null),
    ];
    const todasAbiertas = grupos.length > 0 && grupos.every((g) => abiertas.claves.has(g.clave));

    const alternarJornada = (clave: string) =>
        setAbiertas((previas) => {
            const claves = new Set(previas.claves);
            if (!claves.delete(clave)) claves.add(clave);
            return { ...previas, claves };
        });

    const alternarTodas = () =>
        setAbiertas((previas) => ({
            ...previas,
            claves: todasAbiertas ? new Set() : new Set(grupos.map((g) => g.clave)),
        }));

    return (
        <div className="space-y-8">
            {/* ======================= 1. SEDES ======================= */}
            <Tarjeta variante="panel" as="section">
                <TituloSeccion paso={1}>Sedes</TituloSeccion>
                <SedesSeccion sedes={sedes} guardando={guardando} onCrear={onCrearSede} onEliminar={onEliminarSede} />
            </Tarjeta>

            {/* ======================= 2. TEMPORADA ======================= */}
            {/* Bloque "activo": el formulario y el rol trabajan sobre la
                temporada que se elija aquí (design.md → bloque activo). */}
            <Tarjeta variante="panel" as="section" className="space-y-4 border-borde-fuerte">
                <TituloSeccion
                    paso={2}
                    descripcion={
                        elegida && (
                            <>
                                Trabajando en{' '}
                                <Link href={urlTemporada(elegida.liga, elegida.temporada.number)} className={claseEnlace}>
                                    {nombreTemporada(elegida.liga, elegida.temporada.number)}
                                </Link>
                                .
                            </>
                        )
                    }
                >
                    Temporada de trabajo
                </TituloSeccion>
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={setSeasonId} idPrefix="partidos" />
                {elegida && temporadaCerrada && (
                    <Nota>Esta temporada está cerrada: sus partidos ya no se crean, editan ni capturan.</Nota>
                )}
                {elegida && elegida.temporada.status === 'inscripciones' && (
                    <Nota>Esta temporada aún no está activa: puedes programar partidos, pero los marcadores se capturan cuando pase a activa.</Nota>
                )}
            </Tarjeta>

            {/* ======================= 3. NUEVO PARTIDO ======================= */}
            {elegida && !temporadaCerrada && (
                <Tarjeta variante="panel" as="section">
                    <TituloSeccion paso={3}>Nuevo partido</TituloSeccion>
                    <PartidoForm
                        inscripciones={inscripciones}
                        partidos={partidos}
                        categorias={categorias}
                        sedes={sedes}
                        textoBoton="Agregar al rol"
                        guardando={guardando}
                        onEnviar={onCrearPartido}
                    />
                </Tarjeta>
            )}

            {/* ======================= 4. EL ROL ======================= */}
            {elegida && (
                <section>
                    <TituloSeccion
                        paso={temporadaCerrada ? 3 : 4}
                        acciones={
                            <div className="flex flex-wrap items-center gap-2">
                                {grupos.length > 1 && (
                                    <Boton variante="fantasma" tamano="sm" onClick={alternarTodas}>
                                        {todasAbiertas ? 'Cerrar todas' : 'Abrir todas'}
                                    </Boton>
                                )}
                                {categorias.length > 1 && (
                                    <div>
                                        <label htmlFor="rol-filtro" className="sr-only">
                                            Categoría
                                        </label>
                                        <select
                                            id="rol-filtro"
                                            value={filtro}
                                            onChange={(e) => setFiltro(e.target.value as TeamCategory | '')}
                                            className={`${claseCampo} min-w-48`}
                                        >
                                            <option value="">Todas las categorías</option>
                                            {categorias.map((c) => (
                                                <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                                            ))}
                                        </select>
                                    </div>
                                )}
                            </div>
                        }
                    >
                        El rol
                    </TituloSeccion>

                    {cargandoTemporada && <Cargando texto="Cargando partidos…" />}

                    {!cargandoTemporada && grupos.length === 0 && (
                        <Vacio>Todavía no hay partidos en esta temporada.</Vacio>
                    )}

                    <div className="space-y-3">
                        {!cargandoTemporada &&
                            grupos.map((grupo) => (
                                <JornadaGrupo
                                    key={grupo.clave}
                                    titulo={grupo.titulo}
                                    diaComun={grupo.diaComun}
                                    total={grupo.partidos.length}
                                    conResultado={grupo.partidos.filter((p) => p.status === 'finalizado').length}
                                    abierto={abiertas.claves.has(grupo.clave)}
                                    onAlternar={() => alternarJornada(grupo.clave)}
                                >
                                    {agruparPorCategoria(grupo.partidos).map(({ categoria, partidos: delaCategoria }) => (
                                        <div key={categoria} className="space-y-2">
                                            <h4 className="text-meta font-semibold text-tenue">
                                                {etiquetaCategoria[categoria]}{' '}
                                                <span className="font-normal tabular-nums">({delaCategoria.length})</span>
                                            </h4>
                                            <ul className="space-y-2">
                                                {delaCategoria.map((p) => (
                                                    <FilaPartido
                                                        key={p.id}
                                                        partido={p}
                                                        soloHora={grupo.diaComun !== null}
                                                        acciones={!temporadaCerrada}
                                                        marcador={puedeCapturar}
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
                                </JornadaGrupo>
                            ))}
                    </div>
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
            {/* Confirmación de lo destructivo (components/use-confirmar.tsx). */}
            {modalConfirmar}
        </div>
    );
}

/** Un partido del rol: la tarjeta compartida + las acciones del admin. */
function FilaPartido({
    partido: p,
    soloHora,
    acciones,
    marcador,
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
    /** false si la temporada no está activa: no se capturan ni corrigen marcadores. */
    marcador: boolean;
    guardando: boolean;
    onResultado: () => void;
    onEditar: () => void;
    onSuspender: () => void;
    onBorrar: () => void;
}) {
    const finalizado = p.status === 'finalizado';

    return (
        <PartidoTarjeta partido={p} soloHora={soloHora}>
            {acciones && (
                // Las acciones van separadas del partido por una línea fina.
                // "Capturar resultado" es la acción principal de la fila, pero
                // en secundario: un primario por fila serían diez en la pantalla.
                <div className="flex flex-wrap gap-1.5 border-t border-borde pt-3">
                    {marcador && (
                        <Boton variante="secundario" tamano="sm" disabled={guardando} onClick={onResultado}>
                            {finalizado ? 'Resultado' : 'Capturar resultado'}
                        </Boton>
                    )}
                    {/* Un finalizado no se edita ni se borra: primero se deshace su resultado. */}
                    {!finalizado && (
                        <>
                            <Boton variante="fantasma" tamano="sm" disabled={guardando} onClick={onEditar}>
                                Editar / reprogramar
                            </Boton>
                            <Boton variante="fantasma" tamano="sm" disabled={guardando} onClick={onSuspender}>
                                {p.status === 'suspendido' ? 'Reactivar' : 'Suspender'}
                            </Boton>
                            <Boton variante="peligro" tamano="sm" disabled={guardando} onClick={onBorrar}>
                                Borrar
                            </Boton>
                        </>
                    )}
                </div>
            )}
        </PartidoTarjeta>
    );
}
