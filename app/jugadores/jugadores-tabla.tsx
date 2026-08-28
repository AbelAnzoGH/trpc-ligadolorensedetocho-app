'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpcQuery } from '@/utils/trpc-fetch';
import { playerPositions, type PlayerPosition } from '@/lib/player-schema';
import { inputClass, etiquetaCategoria, type Team, type ListTeamsResponse } from '@/lib/team-ui';
import {
    etiquetaPosicion,
    type MembershipConJugador,
    type ListMembershipsResponse,
} from '@/lib/player-ui';
import JugadorTarjeta from './jugador-tarjeta';

type Orden = 'asc' | 'desc';

export default function JugadoresTabla() {
    const [membresias, setMembresias] = useState<MembershipConJugador[]>([]);
    const [total, setTotal] = useState(0);
    const [equipos, setEquipos] = useState<Team[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    // --- Filtros que se aplican al instante (son <select>, un clic = un valor) ---
    const [equipoId, setEquipoId] = useState('');
    const [posicion, setPosicion] = useState<PlayerPosition | ''>('');
    const [orden, setOrden] = useState<Orden>('asc');

    // --- Filtros de texto: lo que el usuario escribe vs. lo que ya se pidió ---
    // Sin esta separación, cada tecla dispararía una petición al servidor.
    const [busqueda, setBusqueda] = useState('');
    const [jersey, setJersey] = useState('');
    const [busquedaAplicada, setBusquedaAplicada] = useState('');
    const [jerseyAplicado, setJerseyAplicado] = useState('');

    // Espera 350 ms sin que el usuario teclee antes de aplicar el filtro.
    // El `clearTimeout` del return cancela el temporizador anterior cada vez
    // que se escribe una letra nueva: eso es lo que hace el "debounce".
    useEffect(() => {
        const id = setTimeout(() => {
            setBusquedaAplicada(busqueda.trim());
            setJerseyAplicado(jersey.trim());
        }, 350);

        return () => clearTimeout(id);
    }, [busqueda, jersey]);

    // Los equipos del <select> se cargan una sola vez, no en cada filtrado.
    useEffect(() => {
        trpcQuery<ListTeamsResponse>('listTeams')
            .then((data) => setEquipos(data.data.teams))
            .catch(() => setEquipos([]));
    }, []);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const numeroJersey = jerseyAplicado === '' ? undefined : Number(jerseyAplicado);

            const data = await trpcQuery<ListMembershipsResponse>('listMemberships', {
                teamId: equipoId || undefined,
                position: posicion || undefined,
                // Un jersey mal escrito (letras) da NaN; mejor no mandarlo
                // que recibir un 400 de Zod mientras el usuario aún escribe.
                jerseyNumber: Number.isFinite(numeroJersey) ? numeroJersey : undefined,
                search: busquedaAplicada || undefined,
                order: orden,
            });

            setMembresias(data.data.memberships);
            setTotal(data.total);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, [equipoId, posicion, orden, busquedaAplicada, jerseyAplicado]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const hayFiltros =
        equipoId !== '' || posicion !== '' || busqueda !== '' || jersey !== '' || orden !== 'asc';

    const limpiarFiltros = () => {
        setEquipoId('');
        setPosicion('');
        setOrden('asc');
        setBusqueda('');
        setJersey('');
    };

    return (
        <div className="space-y-6">
            {/* ---------- Barra de filtros ---------- */}
            <div className="grid gap-4 rounded-lg border border-gray-800 bg-gray-900/40 p-5 sm:grid-cols-2 lg:grid-cols-4">
                <div className="flex flex-col gap-1">
                    <label htmlFor="f-equipo" className="text-sm text-gray-300">Equipo</label>
                    <select
                        id="f-equipo"
                        value={equipoId}
                        onChange={(e) => setEquipoId(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Todos</option>
                        {equipos.map((equipo) => (
                            <option key={equipo.id} value={equipo.id}>
                                {equipo.name} ({etiquetaCategoria[equipo.category]})
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="f-posicion" className="text-sm text-gray-300">Posición</label>
                    <select
                        id="f-posicion"
                        value={posicion}
                        onChange={(e) => setPosicion(e.target.value as PlayerPosition | '')}
                        className={inputClass}
                    >
                        <option value="">Todas</option>
                        {playerPositions.map((p) => (
                            <option key={p} value={p}>
                                {p} — {etiquetaPosicion[p]}
                            </option>
                        ))}
                    </select>
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="f-jersey" className="text-sm text-gray-300">Número</label>
                    <input
                        id="f-jersey"
                        type="number"
                        min={0}
                        max={99}
                        value={jersey}
                        onChange={(e) => setJersey(e.target.value)}
                        className={inputClass}
                        placeholder="Ej. 7"
                    />
                </div>

                <div className="flex flex-col gap-1">
                    <label htmlFor="f-orden" className="text-sm text-gray-300">Orden</label>
                    <select
                        id="f-orden"
                        value={orden}
                        onChange={(e) => setOrden(e.target.value as Orden)}
                        className={inputClass}
                    >
                        <option value="asc">Apellido A → Z</option>
                        <option value="desc">Apellido Z → A</option>
                    </select>
                </div>

                <div className="flex flex-col gap-1 sm:col-span-2 lg:col-span-3">
                    <label htmlFor="f-busqueda" className="text-sm text-gray-300">Buscar</label>
                    <input
                        id="f-busqueda"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        className={inputClass}
                        placeholder="Nombre o apellido"
                    />
                </div>

                <div className="flex items-end">
                    <button
                        type="button"
                        onClick={limpiarFiltros}
                        disabled={!hayFiltros}
                        className="w-full rounded-full border border-gray-600 px-4 py-2 text-sm font-semibold text-gray-300 transition hover:text-white disabled:opacity-40"
                    >
                        Limpiar filtros
                    </button>
                </div>
            </div>

            {/* ---------- Conteo ---------- */}
            {!cargando && !error && (
                <p className="text-sm text-gray-500">
                    {total === 0
                        ? 'Sin resultados'
                        : `${total} ${total === 1 ? 'registro' : 'registros'}`}
                    {hayFiltros && total > 0 && ' con los filtros aplicados'}
                </p>
            )}

            {/* ---------- Rejilla de 3 columnas ---------- */}
            {cargando && <p className="text-gray-300">Cargando jugadores...</p>}
            {error && <p className="text-red-400">Error: {error}</p>}

            {!cargando && !error && membresias.length === 0 && (
                <p className="text-gray-400">
                    Ningún jugador coincide con los filtros.
                </p>
            )}

            {!cargando && !error && membresias.length > 0 && (
                <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {membresias.map((membresia) => (
                        <JugadorTarjeta key={membresia.id} membresia={membresia} />
                    ))}
                </ul>
            )}

            {/* FUTURO: cuando las fotos hagan pesada la carga, aquí va el botón
                "Cargar más". El backend ya acepta `take` y `skip`, y devuelve
                `total`, así que es cuestión de guardar cuántos van cargados y
                pedir el siguiente bloque concatenando al arreglo. */}
        </div>
    );
}
