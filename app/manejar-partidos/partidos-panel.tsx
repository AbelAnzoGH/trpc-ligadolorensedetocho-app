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
import Tarjeta from '@/components/ui/tarjeta';
import { TituloSeccion } from '@/components/ui/pagina';
import { Cargando, MensajeError, Nota, Vacio } from '@/components/ui/estado';
import { claseCampo } from '@/components/ui/campo';
import { claseEnlace } from '@/components/ui/enlace';
import { nombreTemporada, urlTemporada, type TeamSeason, type ListTeamSeasonsResponse } from '@/lib/season-ui';
import PartidoTarjeta from '@/components/partido-tarjeta';
import {
    agruparPorJornada,
    formatoDiaPartido,
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

    if (cargando) return <Cargando texto="Cargando ligas…" />;
    if (error) return <MensajeError>Error: {error}</MensajeError>;

    const temporadaCerrada = elegida?.temporada.status === 'cerrada';
    const categorias = elegida?.temporada.categories ?? [];
    const filtro: TeamCategory | '' = filtroElegido && categorias.includes(filtroElegido) ? filtroElegido : '';
    const visibles = filtro ? partidos.filter((p) => p.homeTeamSeason.category === filtro) : partidos;
    const grupos = agruparPorJornada(visibles);

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
                            categorias.length > 1 && (
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
                            )
                        }
                    >
                        El rol
                    </TituloSeccion>

                    {cargandoTemporada && <Cargando texto="Cargando partidos…" />}

                    {!cargandoTemporada && grupos.length === 0 && (
                        <Vacio>Todavía no hay partidos en esta temporada.</Vacio>
                    )}

                    <div className="space-y-8">
                        {!cargandoTemporada &&
                            grupos.map((grupo) => (
                                <div key={grupo.clave} className="space-y-3">
                                    {/* Mismo título de jornada que la página pública. */}
                                    <h3 className="text-cuerpo font-semibold text-tinta-2">
                                        {grupo.titulo}
                                        {/* Si toda la jornada es el mismo día, se dice UNA vez aquí
                                            y cada fila muestra solo la hora. */}
                                        {grupo.diaComun && (
                                            <span className="font-normal text-tenue">
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
        </div>
    );
}

/** Un partido del rol: la tarjeta compartida + las acciones del admin. */
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

    return (
        <PartidoTarjeta partido={p} soloHora={soloHora}>
            {acciones && (
                // Las acciones van separadas del partido por una línea fina.
                // "Capturar resultado" es la acción principal de la fila, pero
                // en secundario: un primario por fila serían diez en la pantalla.
                <div className="flex flex-wrap gap-1.5 border-t border-borde pt-3">
                    <Boton variante="secundario" tamano="sm" disabled={guardando} onClick={onResultado}>
                        {finalizado ? 'Resultado' : 'Capturar resultado'}
                    </Boton>
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
