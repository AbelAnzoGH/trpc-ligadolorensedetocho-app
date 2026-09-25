'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import Modal from '@/components/modal';
import Avatar from '@/components/ui/avatar';
import Boton from '@/components/ui/boton';
import Insignia from '@/components/ui/insignia';
import { Cargando, MensajeError, Nota, Vacio } from '@/components/ui/estado';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseChip } from '@/components/ui/chip';
import { claseEnlace } from '@/components/ui/enlace';
import SelectorImagen from '@/components/selector-imagen';
import PosicionesCheckboxes from '@/app/manejar-jugadores/posiciones-checkboxes';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { subirImagen } from '@/utils/subir-imagen';
import type { PlayerPosition } from '@/lib/player-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import { nombreTemporada, type TeamSeason, type ListTeamSeasonsResponse } from '@/lib/season-ui';
import {
    etiquetaPosicion,
    type Player,
    type ListPlayersResponse,
    type MembershipConJugador,
    type ListMembershipsResponse,
} from '@/lib/player-ui';

/**
 * PLANTEL de un equipo, editable. Es el atajo para registrar jugadores sin
 * pasar por /manejar-jugadores: se abre desde /manejar-temporadas (cada equipo
 * inscrito) y desde /manejar-equipos (cada equipo).
 *
 * Un plantel no es del equipo sino de una INSCRIPCIÓN (equipo + temporada +
 * categoría). Por eso el modal recibe el equipo y, si se abre desde una
 * inscripción concreta, cuál preseleccionar. Si el equipo tiene varias
 * inscripciones, arriba aparece un selector.
 *
 * Dos formas de agregar:
 *   - Jugador nuevo  → registerPlayerInTeam: crea a la persona y su membresía
 *                      en una sola transacción.
 *   - Ya registrado  → addPlayerToTeam: una persona que ya existe (p. ej. juega
 *                      varonil y ahora también mixto).
 *
 * El padre lo monta solo cuando está abierto (`{abierto && <PlantelModal …/>}`),
 * así cada apertura empieza con el estado limpio.
 */
export default function PlantelModal({
    equipo,
    inscripcionId,
    onCerrar,
    onCambio,
}: {
    equipo: { id: string; name: string };
    /** La inscripción a mostrar primero. Si no viene, la más reciente que no esté cerrada. */
    inscripcionId?: string;
    onCerrar: () => void;
    /** Se llama tras cada cambio, para que la pantalla de atrás actualice sus conteos. */
    onCambio?: () => Promise<void> | void;
}) {
    // ---------- Datos ----------
    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [elegidaId, setElegidaId] = useState(inscripcionId ?? '');
    const [plantel, setPlantel] = useState<MembershipConJugador[]>([]);
    const [personas, setPersonas] = useState<Player[]>([]);
    const [cargando, setCargando] = useState(true);
    const [cargandoPlantel, setCargandoPlantel] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);

    // ---------- Formulario ----------
    const [modo, setModo] = useState<'nuevo' | 'registrado'>('nuevo');
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [edad, setEdad] = useState('');
    const [altura, setAltura] = useState('');
    const [busqueda, setBusqueda] = useState('');
    const [elegido, setElegido] = useState<Player | null>(null);
    const [jersey, setJersey] = useState('');
    const [posiciones, setPosiciones] = useState<PlayerPosition[]>([]);
    const [foto, setFoto] = useState<File | null>(null);
    const refNombre = useRef<HTMLInputElement>(null);

    // Las inscripciones del equipo y el padrón de personas (para buscar y
    // para avisar de duplicados) se piden una vez, al abrir.
    useEffect(() => {
        let cancelado = false;
        Promise.all([
            trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', { teamId: equipo.id }),
            trpcQuery<ListPlayersResponse>('listPlayers'),
        ])
            .then(([respInscripciones, respPersonas]) => {
                if (cancelado) return;
                const lista = respInscripciones.data.teamSeasons;
                setInscripciones(lista);
                setPersonas(respPersonas.data.players);
                // El servidor las manda de la temporada más nueva a la más vieja.
                setElegidaId(
                    (actual) =>
                        (actual && lista.some((i) => i.id === actual) ? actual : undefined) ??
                        lista.find((i) => i.season.status !== 'cerrada')?.id ??
                        lista[0]?.id ??
                        '',
                );
            })
            .catch((err: unknown) => {
                if (!cancelado) setError(err instanceof Error ? err.message : 'Error desconocido');
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });
        return () => {
            cancelado = true;
        };
    }, [equipo.id]);

    const cargarPlantel = useCallback(async () => {
        if (!elegidaId) return;
        setCargandoPlantel(true);
        try {
            const resp = await trpcQuery<ListMembershipsResponse>('listMemberships', { teamSeasonId: elegidaId });
            // En un plantel se lee mejor por número de camiseta.
            setPlantel([...resp.data.memberships].sort((a, b) => a.jerseyNumber - b.jerseyNumber));
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargandoPlantel(false);
        }
    }, [elegidaId]);

    useEffect(() => {
        cargarPlantel();
    }, [cargarPlantel]);

    const inscripcion = inscripciones.find((i) => i.id === elegidaId) ?? null;
    const cerrada = inscripcion?.season.status === 'cerrada';
    const etiquetaInscripcion = (i: TeamSeason) =>
        `${nombreTemporada(i.season.league, i.season.number)} · ${etiquetaCategoria[i.category]}`;

    // ---------- Avisos que se calculan en cada render ----------
    // Comparación sin mayúsculas ni acentos: "José" y "jose" son el mismo nombre.
    const normalizar = (texto: string) =>
        texto.normalize('NFD').replace(/[̀-ͯ]/g, '').trim().toLowerCase();

    const enPlantel = new Set(plantel.map((m) => m.player.id));
    const homonimos =
        modo === 'nuevo' && nombre.trim() && apellido.trim()
            ? personas.filter(
                  (p) => normalizar(p.name) === normalizar(nombre) && normalizar(p.lastName) === normalizar(apellido),
              )
            : [];
    const jerseyUsadoPor = jersey !== '' ? plantel.find((m) => m.jerseyNumber === Number(jersey)) : undefined;

    const termino = normalizar(busqueda);
    const resultados = termino
        ? personas
              .filter((p) => !enPlantel.has(p.id) && normalizar(`${p.name} ${p.lastName}`).includes(termino))
              .slice(0, 8)
        : [];

    // ---------- Acciones ----------
    const limpiar = () => {
        setNombre('');
        setApellido('');
        setEdad('');
        setAltura('');
        setBusqueda('');
        setElegido(null);
        setJersey('');
        setPosiciones([]);
        setFoto(null);
    };

    const despuesDeCambio = async () => {
        await cargarPlantel();
        await onCambio?.();
    };

    const onAgregar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inscripcion) return;

        if (modo === 'nuevo') {
            if (!nombre.trim() || !apellido.trim()) return void toast.error('Nombre y apellido son requeridos');
            if (!edad || !altura) return void toast.error('Edad y altura son requeridas');
        } else if (!elegido) {
            return void toast.error('Busca y elige a la persona');
        }
        if (jersey === '') return void toast.error('El número de jersey es requerido');
        if (posiciones.length === 0) return void toast.error('Selecciona al menos una posición');

        setGuardando(true);
        try {
            // PASO 1 — La foto (si hay) se sube antes de tocar la base, igual
            // que en /manejar-jugadores.
            const subida = foto ? await subirImagen(foto, 'jugadores') : null;
            const membresia = {
                teamSeasonId: inscripcion.id,
                jerseyNumber: Number(jersey),
                positions: posiciones,
                ...(subida ? { photoUrl: subida.url, photoKey: subida.key } : {}),
            };

            // PASO 2 — Un solo endpoint por caso.
            if (modo === 'nuevo') {
                await trpcMutation('registerPlayerInTeam', {
                    name: nombre.trim(),
                    lastName: apellido.trim(),
                    age: Number(edad),
                    height: Number(altura),
                    ...membresia,
                });
                toast.success(`${nombre.trim()} ${apellido.trim()} agregado al plantel`);
                // La persona nueva ya existe: se agrega al padrón para que el
                // aviso de duplicados la considere en el siguiente registro.
                const resp = await trpcQuery<ListPlayersResponse>('listPlayers');
                setPersonas(resp.data.players);
            } else {
                await trpcMutation('addPlayerToTeam', { playerId: elegido!.id, ...membresia });
                toast.success(`${elegido!.name} ${elegido!.lastName} agregado al plantel`);
            }

            limpiar();
            await despuesDeCambio();
            // Listo para el siguiente: el cursor vuelve al primer campo.
            if (modo === 'nuevo') refNombre.current?.focus();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const onQuitar = async (m: MembershipConJugador) => {
        setGuardando(true);
        try {
            await trpcMutation('removeMembership', { id: m.id });
            toast.success(`${m.player.name} ${m.player.lastName} quitado del plantel`);
            await despuesDeCambio();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const usarRegistrado = (p: Player) => {
        setModo('registrado');
        setElegido(p);
    };

    const campo = `${claseCampo} w-full`;

    return (
        <Modal
            abierto
            onCerrar={onCerrar}
            titulo={`Plantel de ${equipo.name}`}
            subtitulo={
                inscripcion
                    ? `${etiquetaInscripcion(inscripcion)} · ${plantel.length} ${plantel.length === 1 ? 'jugador' : 'jugadores'}`
                    : undefined
            }
        >
            {cargando && <Cargando texto="Cargando plantel…" />}
            {!cargando && error && <MensajeError>Error: {error}</MensajeError>}

            {!cargando && !error && inscripciones.length === 0 && (
                <Vacio
                    accion={
                        <Link href="/manejar-temporadas" className={claseEnlace}>
                            Inscribirlo en Manejar temporadas
                        </Link>
                    }
                >
                    {equipo.name} no está inscrito en ninguna temporada. El plantel pertenece a una inscripción
                    (temporada y categoría).
                </Vacio>
            )}

            {!cargando && !error && inscripcion && (
                <div className="space-y-6">
                    {/* ---------- Cuál inscripción ---------- */}
                    {inscripciones.length > 1 && (
                        <div className={claseGrupoCampo}>
                            <label htmlFor="plantel-inscripcion" className={claseEtiqueta}>
                                Temporada y categoría
                            </label>
                            <select
                                id="plantel-inscripcion"
                                value={elegidaId}
                                onChange={(e) => setElegidaId(e.target.value)}
                                className={campo}
                            >
                                {inscripciones.map((i) => (
                                    <option key={i.id} value={i.id}>
                                        {etiquetaInscripcion(i)}
                                        {i.season.status === 'cerrada' ? ' (cerrada)' : ''}
                                    </option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* ---------- El plantel ---------- */}
                    {cargandoPlantel && <Cargando texto="Cargando jugadores…" />}
                    {!cargandoPlantel && plantel.length === 0 && (
                        <Vacio>Todavía no hay jugadores en este plantel.</Vacio>
                    )}
                    {!cargandoPlantel && plantel.length > 0 && (
                        <ul className="divide-y divide-borde">
                            {plantel.map((m) => (
                                <li key={m.id} className="flex items-center gap-3 py-2.5">
                                    <Avatar src={m.photoUrl} nombre={m.player.name} apellido={m.player.lastName} tamano={40} />
                                    <div className="min-w-0 flex-1">
                                        <p className="truncate font-semibold text-tinta">
                                            {m.player.name} {m.player.lastName}
                                        </p>
                                        <div className="mt-1 flex flex-wrap gap-1.5">
                                            {m.positions.map((p) => (
                                                <Insignia key={p} tono="contorno" title={etiquetaPosicion[p]}>
                                                    {p}
                                                </Insignia>
                                            ))}
                                        </div>
                                    </div>
                                    <span className="shrink-0 text-cuerpo-lg font-bold tabular-nums text-tinta">
                                        <span className="text-apagado">#</span>
                                        {m.jerseyNumber}
                                    </span>
                                    {!cerrada && (
                                        <Boton variante="peligro" tamano="sm" onClick={() => onQuitar(m)} disabled={guardando}>
                                            Quitar
                                        </Boton>
                                    )}
                                </li>
                            ))}
                        </ul>
                    )}

                    {cerrada && <Nota>Esta temporada está cerrada: su plantel ya no cambia.</Nota>}

                    {/* ---------- Agregar ---------- */}
                    {!cerrada && (
                        <form onSubmit={onAgregar} className="space-y-5 border-t border-borde pt-5">
                            <div className="flex flex-wrap items-center justify-between gap-3">
                                <h3 className="font-semibold text-tinta">Agregar jugador</h3>
                                <div className="flex gap-2" role="group" aria-label="Tipo de jugador">
                                    <button
                                        type="button"
                                        aria-pressed={modo === 'nuevo'}
                                        onClick={() => setModo('nuevo')}
                                        className={claseChip(modo === 'nuevo')}
                                    >
                                        Jugador nuevo
                                    </button>
                                    <button
                                        type="button"
                                        aria-pressed={modo === 'registrado'}
                                        onClick={() => setModo('registrado')}
                                        className={claseChip(modo === 'registrado')}
                                    >
                                        Ya registrado
                                    </button>
                                </div>
                            </div>

                            {/* ----- La persona: nueva ----- */}
                            {modo === 'nuevo' && (
                                <div className="space-y-3">
                                    <div className="grid gap-3 sm:grid-cols-2">
                                        <div className={claseGrupoCampo}>
                                            <label htmlFor="plantel-nombre" className={claseEtiqueta}>Nombre</label>
                                            <input
                                                id="plantel-nombre"
                                                ref={refNombre}
                                                value={nombre}
                                                onChange={(e) => setNombre(e.target.value)}
                                                className={campo}
                                            />
                                        </div>
                                        <div className={claseGrupoCampo}>
                                            <label htmlFor="plantel-apellido" className={claseEtiqueta}>Apellido</label>
                                            <input
                                                id="plantel-apellido"
                                                value={apellido}
                                                onChange={(e) => setApellido(e.target.value)}
                                                className={campo}
                                            />
                                        </div>
                                        <div className={claseGrupoCampo}>
                                            <label htmlFor="plantel-edad" className={claseEtiqueta}>Edad</label>
                                            <input
                                                id="plantel-edad"
                                                type="number"
                                                min={5}
                                                max={99}
                                                value={edad}
                                                onChange={(e) => setEdad(e.target.value)}
                                                className={campo}
                                            />
                                        </div>
                                        <div className={claseGrupoCampo}>
                                            <label htmlFor="plantel-altura" className={claseEtiqueta}>Altura (cm)</label>
                                            <input
                                                id="plantel-altura"
                                                type="number"
                                                min={100}
                                                max={250}
                                                value={altura}
                                                onChange={(e) => setAltura(e.target.value)}
                                                className={campo}
                                            />
                                        </div>
                                    </div>

                                    {/* Posible duplicado: mismo nombre y apellido que alguien ya registrado. */}
                                    {homonimos.length > 0 && (
                                        <p className="text-meta text-aviso">
                                            Ya hay {homonimos.length === 1 ? 'una persona registrada' : `${homonimos.length} personas registradas`}{' '}
                                            con ese nombre. Si es la misma,{' '}
                                            <button
                                                type="button"
                                                onClick={() => usarRegistrado(homonimos[0])}
                                                className="font-medium underline underline-offset-4"
                                            >
                                                usa la ya registrada
                                            </button>{' '}
                                            para no duplicarla.
                                        </p>
                                    )}
                                </div>
                            )}

                            {/* ----- La persona: ya registrada ----- */}
                            {modo === 'registrado' && (
                                <div className="space-y-3">
                                    {elegido ? (
                                        <div className="flex items-center justify-between gap-3 rounded-item border border-borde-fuerte bg-canvas px-4 py-3">
                                            <span className="min-w-0">
                                                <span className="block truncate font-semibold text-tinta">
                                                    {elegido.name} {elegido.lastName}
                                                </span>
                                                <span className="text-meta text-tenue">
                                                    {elegido.age} años · {elegido.height} cm
                                                </span>
                                            </span>
                                            <Boton variante="fantasma" tamano="sm" onClick={() => setElegido(null)}>
                                                Cambiar
                                            </Boton>
                                        </div>
                                    ) : (
                                        <>
                                            <div className={claseGrupoCampo}>
                                                <label htmlFor="plantel-buscar" className={claseEtiqueta}>Buscar persona</label>
                                                <input
                                                    id="plantel-buscar"
                                                    type="search"
                                                    value={busqueda}
                                                    onChange={(e) => setBusqueda(e.target.value)}
                                                    className={campo}
                                                    placeholder="Nombre o apellido"
                                                />
                                            </div>
                                            {termino && resultados.length === 0 && (
                                                <p className="text-meta text-tenue">
                                                    Nadie coincide (o ya está en este plantel). Regístralo como jugador nuevo.
                                                </p>
                                            )}
                                            {resultados.length > 0 && (
                                                <ul className="divide-y divide-borde rounded-item border border-borde">
                                                    {resultados.map((p) => (
                                                        <li key={p.id}>
                                                            <button
                                                                type="button"
                                                                onClick={() => setElegido(p)}
                                                                className="flex w-full items-center justify-between gap-3 px-4 py-2.5 text-left hover:bg-superficie-2"
                                                            >
                                                                <span className="truncate text-tinta">
                                                                    {p.name} {p.lastName}
                                                                </span>
                                                                <span className="shrink-0 text-meta text-tenue">
                                                                    {p.age} años
                                                                </span>
                                                            </button>
                                                        </li>
                                                    ))}
                                                </ul>
                                            )}
                                        </>
                                    )}
                                </div>
                            )}

                            {/* ----- Su lugar en ESTE equipo ----- */}
                            <div className={claseGrupoCampo}>
                                <label htmlFor="plantel-jersey" className={claseEtiqueta}>Número de jersey</label>
                                <input
                                    id="plantel-jersey"
                                    type="number"
                                    min={0}
                                    max={99}
                                    value={jersey}
                                    onChange={(e) => setJersey(e.target.value)}
                                    className={`${claseCampo} w-28`}
                                    aria-invalid={jerseyUsadoPor ? true : undefined}
                                />
                                {jerseyUsadoPor && (
                                    <span className="text-meta text-aviso">
                                        El #{jersey} ya lo usa {jerseyUsadoPor.player.name} {jerseyUsadoPor.player.lastName}.
                                    </span>
                                )}
                            </div>

                            <div className={claseGrupoCampo}>
                                <span className={claseEtiqueta}>Posiciones</span>
                                <PosicionesCheckboxes value={posiciones} onChange={setPosiciones} />
                            </div>

                            <SelectorImagen
                                etiqueta="Foto con este uniforme"
                                archivo={foto}
                                urlActual={null}
                                onSeleccionar={setFoto}
                                onQuitar={() => setFoto(null)}
                            />

                            <Boton type="submit" anchoCompleto disabled={guardando}>
                                {guardando ? 'Guardando…' : 'Agregar al plantel'}
                            </Boton>
                        </form>
                    )}
                </div>
            )}
        </Modal>
    );
}
