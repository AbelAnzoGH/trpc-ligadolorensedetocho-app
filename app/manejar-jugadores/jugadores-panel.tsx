'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import Boton from '@/components/ui/boton';
import Tarjeta from '@/components/ui/tarjeta';
import { TituloSeccion } from '@/components/ui/pagina';
import { Cargando, MensajeError, Vacio } from '@/components/ui/estado';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { etiquetaCategoria } from '@/lib/team-ui';
import { nombreTemporada, type TeamSeason, type ListTeamSeasonsResponse } from '@/lib/season-ui';
import type { Player, ListPlayersResponse } from '@/lib/player-ui';
import JugadorCard from './jugador-card';

// Valor especial del filtro: "todas las personas que juegan en la temporada".
const FILTRO_TEMPORADA = '__temporada';

/**
 * Orquestador de la pantalla: carga jugadores y las inscripciones de la
 * TEMPORADA DE TRABAJO, y le pasa a cada tarjeta la función `cargar` para
 * que se refresque todo tras cada cambio.
 *
 * La temporada de trabajo decide a qué equipos se puede agregar a alguien:
 * agregar a Juan "al Patito" siempre significa "al Patito de ESTA temporada".
 */
export default function JugadoresPanel() {
    const { ligas, seasonId, setSeasonId, elegida } = useLigas();

    const [jugadores, setJugadores] = useState<Player[]>([]);
    const [equipos, setEquipos] = useState<TeamSeason[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Filtro ('' = todas las personas, FILTRO_TEMPORADA = las que juegan en
    // la temporada de trabajo, o el id de una inscripción). Se resuelve en el servidor.
    const [filtroEquipo, setFiltroEquipo] = useState(FILTRO_TEMPORADA);
    // Buscador por nombre: se filtra en el navegador sobre lo ya cargado.
    const [busqueda, setBusqueda] = useState('');

    // Formulario de alta de persona
    const [nombre, setNombre] = useState('');
    const [apellido, setApellido] = useState('');
    const [edad, setEdad] = useState('');
    const [altura, setAltura] = useState('');

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            // Las dos peticiones no dependen una de otra, así que van en
            // paralelo con Promise.all en vez de una tras otra.
            const filtro =
                filtroEquipo === FILTRO_TEMPORADA
                    ? seasonId
                        ? { seasonId }
                        : undefined
                    : filtroEquipo
                      ? { teamSeasonId: filtroEquipo }
                      : undefined;

            const [respJugadores, respEquipos] = await Promise.all([
                trpcQuery<ListPlayersResponse>('listPlayers', filtro),
                seasonId
                    ? trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', { seasonId })
                    : Promise.resolve(null),
            ]);

            setJugadores(respJugadores.data.players);
            setEquipos(respEquipos?.data.teamSeasons ?? []);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, [filtroEquipo, seasonId]);

    // Al cambiar de temporada, un filtro por inscripción de la temporada
    // anterior ya no tiene sentido: se regresa a "esta temporada".
    const cambiarTemporada = (id: string) => {
        setSeasonId(id);
        setFiltroEquipo(FILTRO_TEMPORADA);
    };

    const temporada = elegida ? nombreTemporada(elegida.liga, elegida.temporada.number) : '';

    useEffect(() => {
        cargar();
    }, [cargar]);

    const onCrearJugador = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!nombre.trim() || !apellido.trim()) {
            toast.error('Nombre y apellido son requeridos');
            return;
        }
        if (!edad || !altura) {
            toast.error('Edad y altura son requeridas');
            return;
        }

        setGuardando(true);
        try {
            await trpcMutation('createPlayer', {
                name: nombre.trim(),
                lastName: apellido.trim(),
                age: Number(edad),
                height: Number(altura),
            });
            toast.success('Jugador creado');
            setNombre('');
            setApellido('');
            setEdad('');
            setAltura('');
            await cargar();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const termino = busqueda.trim().toLowerCase();
    const visibles = termino
        ? jugadores.filter((j) =>
              `${j.name} ${j.lastName}`.toLowerCase().includes(termino),
          )
        : jugadores;

    // Todos los campos de este panel ocupan su celda completa.
    const campo = `${claseCampo} w-full`;

    return (
        <div className="space-y-8">
            {/* ---------- Alta de persona ---------- */}
            <Tarjeta variante="panel" as="section">
                <TituloSeccion
                    paso={1}
                    descripcion="Primero se registra la persona (una sola vez, para siempre). Después se le agrega a los equipos de cada temporada, cada uno con su propio jersey y estadísticas."
                >
                    Nuevo jugador
                </TituloSeccion>

                <form onSubmit={onCrearJugador} className="space-y-5">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className={claseGrupoCampo}>
                            <label htmlFor="nuevo-nombre" className={claseEtiqueta}>Nombre</label>
                            <input
                                id="nuevo-nombre"
                                value={nombre}
                                onChange={(e) => setNombre(e.target.value)}
                                className={campo}
                                placeholder="Ej. Juan"
                            />
                        </div>
                        <div className={claseGrupoCampo}>
                            <label htmlFor="nuevo-apellido" className={claseEtiqueta}>Apellido</label>
                            <input
                                id="nuevo-apellido"
                                value={apellido}
                                onChange={(e) => setApellido(e.target.value)}
                                className={campo}
                                placeholder="Ej. Pérez"
                            />
                        </div>
                        <div className={claseGrupoCampo}>
                            <label htmlFor="nueva-edad" className={claseEtiqueta}>Edad</label>
                            <input
                                id="nueva-edad"
                                type="number"
                                value={edad}
                                onChange={(e) => setEdad(e.target.value)}
                                className={campo}
                                placeholder="Ej. 24"
                            />
                        </div>
                        <div className={claseGrupoCampo}>
                            <label htmlFor="nueva-altura" className={claseEtiqueta}>Altura (cm)</label>
                            <input
                                id="nueva-altura"
                                type="number"
                                value={altura}
                                onChange={(e) => setAltura(e.target.value)}
                                className={campo}
                                placeholder="Ej. 178"
                            />
                        </div>
                    </div>

                    <Boton type="submit" disabled={guardando}>
                        Crear jugador
                    </Boton>
                </form>
            </Tarjeta>

            {/* ---------- Temporada de trabajo ---------- */}
            {/* Bloque "activo": todo lo de abajo depende de lo que se elija
                aquí, por eso lleva el borde más marcado (design.md). */}
            <Tarjeta variante="panel" as="section" className="border-borde-fuerte">
                <TituloSeccion
                    paso={2}
                    descripcion="Los jugadores se agregan a los equipos inscritos en esta temporada."
                >
                    Temporada de trabajo
                </TituloSeccion>
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={cambiarTemporada} idPrefix="trabajo" />
            </Tarjeta>

            {/* ---------- Jugadores ---------- */}
            <section className="space-y-6">
                <TituloSeccion paso={3}>
                    Jugadores
                </TituloSeccion>

                {/* Barra de filtros (design.md → Barra de filtros) */}
                <div className="flex flex-wrap items-end gap-3 border-b border-borde pb-6">
                    <div className={claseGrupoCampo}>
                        <label htmlFor="filtro-equipo" className={claseEtiqueta}>Mostrar</label>
                        <select
                            id="filtro-equipo"
                            value={filtroEquipo}
                            onChange={(e) => setFiltroEquipo(e.target.value)}
                            className={`${claseCampo} min-w-56`}
                        >
                            <option value={FILTRO_TEMPORADA}>
                                Jugadores de {temporada || 'la temporada'}
                            </option>
                            <option value="">Todas las personas registradas</option>
                            {equipos.map((inscripcion) => (
                                <option key={inscripcion.id} value={inscripcion.id}>
                                    {inscripcion.team.name} ({etiquetaCategoria[inscripcion.category]})
                                </option>
                            ))}
                        </select>
                    </div>

                    <div className={claseGrupoCampo}>
                        <label htmlFor="busqueda" className={claseEtiqueta}>Buscar</label>
                        <input
                            id="busqueda"
                            type="search"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className={`${claseCampo} min-w-56`}
                            placeholder="Nombre o apellido"
                        />
                    </div>

                    {!cargando && !error && (
                        // pb-2.5: el texto queda a la altura del texto de los campos.
                        <span className="pb-2.5 text-meta text-tenue">
                            {visibles.length} {visibles.length === 1 ? 'jugador' : 'jugadores'}
                        </span>
                    )}
                </div>

                {/* ---------- Listado ---------- */}
                {cargando && <Cargando texto="Cargando jugadores…" />}
                {error && <MensajeError>Error: {error}</MensajeError>}

                {!cargando && !error && visibles.length === 0 && (
                    <Vacio>
                        {jugadores.length === 0
                            ? filtroEquipo
                                ? 'Nadie juega todavía aquí. Elige "Todas las personas registradas" para agregar a alguien.'
                                : 'Todavía no hay jugadores registrados.'
                            : 'Ningún jugador coincide con la búsqueda.'}
                    </Vacio>
                )}

                {!cargando && !error && visibles.length > 0 && (
                    <ul className="space-y-4">
                        {visibles.map((jugador) => (
                            <JugadorCard
                                key={jugador.id}
                                jugador={jugador}
                                inscripciones={equipos}
                                seasonId={seasonId}
                                temporada={temporada}
                                onCambio={cargar}
                            />
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
