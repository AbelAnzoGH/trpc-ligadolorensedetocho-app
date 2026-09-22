'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import { inputClass, etiquetaCategoria } from '@/lib/team-ui';
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

    return (
        <div className="space-y-8">
            {/* ---------- Alta de persona ---------- */}
            <form
                onSubmit={onCrearJugador}
                className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-6"
            >
                <div>
                    <h2 className="text-xl font-semibold text-white">Nuevo jugador</h2>
                    <p className="mt-1 text-sm text-gray-400">
                        Primero se registra la persona (una sola vez, para siempre).
                        Después se le agrega a los equipos de cada temporada, cada uno con
                        su propio jersey y estadísticas.
                    </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="nuevo-nombre" className="text-sm text-gray-300">Nombre</label>
                        <input
                            id="nuevo-nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className={inputClass}
                            placeholder="Ej. Juan"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="nuevo-apellido" className="text-sm text-gray-300">Apellido</label>
                        <input
                            id="nuevo-apellido"
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            className={inputClass}
                            placeholder="Ej. Pérez"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="nueva-edad" className="text-sm text-gray-300">Edad</label>
                        <input
                            id="nueva-edad"
                            type="number"
                            value={edad}
                            onChange={(e) => setEdad(e.target.value)}
                            className={inputClass}
                            placeholder="Ej. 24"
                        />
                    </div>
                    <div className="flex flex-col gap-1">
                        <label htmlFor="nueva-altura" className="text-sm text-gray-300">
                            Altura (cm)
                        </label>
                        <input
                            id="nueva-altura"
                            type="number"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            className={inputClass}
                            placeholder="Ej. 178"
                        />
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={guardando}
                    className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-5 py-2 font-semibold text-white transition duration-300 hover:bg-linear-to-l disabled:opacity-50"
                >
                    Crear jugador
                </button>
            </form>

            {/* ---------- Temporada de trabajo ---------- */}
            <div className="space-y-2 rounded-lg border border-pink-500/30 bg-gray-900/40 p-4">
                <p className="text-sm font-semibold text-white">Temporada de trabajo</p>
                <p className="text-xs text-gray-500">
                    Los jugadores se agregan a los equipos inscritos en esta temporada.
                </p>
                <SelectorTemporada ligas={ligas} seasonId={seasonId} onChange={cambiarTemporada} idPrefix="trabajo" />
            </div>

            {/* ---------- Filtros ---------- */}
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor="filtro-equipo" className="text-sm text-gray-300">Mostrar</label>
                    <select
                        id="filtro-equipo"
                        value={filtroEquipo}
                        onChange={(e) => setFiltroEquipo(e.target.value)}
                        className={inputClass}
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

                <div className="flex flex-col gap-1">
                    <label htmlFor="busqueda" className="text-sm text-gray-300">Buscar</label>
                    <input
                        id="busqueda"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={inputClass}
                        placeholder="Nombre o apellido"
                    />
                </div>

                {!cargando && !error && (
                    <span className="pb-2 text-sm text-gray-500">
                        {visibles.length} {visibles.length === 1 ? 'jugador' : 'jugadores'}
                    </span>
                )}
            </div>

            {/* ---------- Listado ---------- */}
            {cargando && <p className="text-gray-300">Cargando jugadores...</p>}
            {error && <p className="text-red-400">Error: {error}</p>}

            {!cargando && !error && visibles.length === 0 && (
                <p className="text-gray-400">
                    {jugadores.length === 0
                        ? filtroEquipo
                            ? 'Nadie juega todavía aquí. Elige "Todas las personas registradas" para agregar a alguien.'
                            : 'Todavía no hay jugadores registrados.'
                        : 'Ningún jugador coincide con la búsqueda.'}
                </p>
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
        </div>
    );
}
