'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/modal';
import Spinner from '@/components/spinner';
import { trpcQuery } from '@/utils/trpc-fetch';
import { etiquetaCategoria, type Team } from '@/lib/team-ui';
import {
    etiquetaPosicion,
    type MembershipConJugador,
    type ListMembershipsResponse,
} from '@/lib/player-ui';

/**
 * Ventana emergente con el plantel de UN equipo.
 *
 * Reglas de diseño:
 *   - Es PÚBLICA: usa `listMemberships`, que está declarado como
 *     publicProcedure, así que funciona con o sin sesión iniciada.
 *   - Pide los jugadores solo cuando el modal se abre, no al cargar /equipos.
 *     Si un visitante nunca abre ningún equipo, nunca se hace esa consulta.
 *   - Mientras el servidor responde (y mientras las fotos viajan desde Blob)
 *     se muestra el Spinner del sitio, para que la espera no se sienta como
 *     una pantalla rota.
 *
 * Ojo con la unidad de datos: lo que se lista NO son personas (Player) sino
 * MEMBRESÍAS (TeamMembership). El número de camiseta y la foto con uniforme
 * pertenecen a la membresía, no a la persona; por eso el mismo Juan puede
 * salir como #7 en el varonil y #23 en el mixto.
 */
export default function EquipoRosterModal({
    equipo,
    onCerrar,
}: {
    /** El equipo cuyo plantel se muestra, o null si no hay ninguno abierto. */
    equipo: Team | null;
    onCerrar: () => void;
}) {
    const [jugadores, setJugadores] = useState<MembershipConJugador[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Modal cerrado: no hay nada que pedir.
        if (!equipo) return;

        // `cancelado` evita el caso de "abro un equipo, lo cierro y abro otro
        // antes de que llegue la primera respuesta": sin esta bandera, la
        // respuesta vieja pisaría a la nueva. El return del useEffect la
        // enciende justo antes de que corra el efecto siguiente.
        let cancelado = false;

        setCargando(true);
        setError(null);
        setJugadores([]);

        trpcQuery<ListMembershipsResponse>('listMemberships', { teamId: equipo.id })
            .then((data) => {
                if (cancelado) return;
                // El servidor ordena por apellido; en una lista de plantel se
                // lee mejor por número de camiseta.
                setJugadores(
                    [...data.data.memberships].sort(
                        (a, b) => a.jerseyNumber - b.jerseyNumber,
                    ),
                );
            })
            .catch((err: unknown) => {
                if (cancelado) return;
                setError(err instanceof Error ? err.message : 'Error desconocido');
            })
            .finally(() => {
                if (!cancelado) setCargando(false);
            });

        return () => {
            cancelado = true;
        };
    }, [equipo]);

    return (
        <Modal
            abierto={equipo !== null}
            onCerrar={onCerrar}
            titulo={equipo?.name ?? ''}
            subtitulo={
                equipo
                    ? `${etiquetaCategoria[equipo.category]}${
                          !cargando && !error
                              ? ` · ${jugadores.length} ${
                                    jugadores.length === 1 ? 'jugador' : 'jugadores'
                                }`
                              : ''
                      }`
                    : undefined
            }
        >
            {/* ---------- Cargando ---------- */}
            {cargando && (
                <div
                    className="flex flex-col items-center justify-center gap-3 py-12"
                    role="status"
                    aria-live="polite"
                >
                    {/* El Spinner viene con `mr-2` pensado para ir dentro de un
                        botón; aquí está centrado, así que no estorba. Los
                        colores se sobrescriben con twMerge desde las props. */}
                    <Spinner
                        width="2.5rem"
                        height="2.5rem"
                        color="text-gray-800"
                        bgColor="fill-pink-500"
                    />
                    <p className="text-sm text-gray-400">Cargando jugadores...</p>
                </div>
            )}

            {/* ---------- Error ---------- */}
            {!cargando && error && (
                <p className="py-8 text-center text-red-400">Error: {error}</p>
            )}

            {/* ---------- Equipo sin jugadores ---------- */}
            {!cargando && !error && jugadores.length === 0 && (
                <p className="py-8 text-center text-gray-400">
                    Este equipo todavía no tiene jugadores registrados.
                </p>
            )}

            {/* ---------- Listado ---------- */}
            {!cargando && !error && jugadores.length > 0 && (
                <ul className="divide-y divide-gray-800">
                    {jugadores.map((membresia) => {
                        const { player: jugador } = membresia;
                        const iniciales =
                            `${jugador.name[0] ?? ''}${jugador.lastName[0] ?? ''}`.toUpperCase();

                        return (
                            <li key={membresia.id} className="flex items-center gap-4 py-3">
                                {/* --- Foto --- */}
                                {/* Tamaño fijo + shrink-0: la foto nunca se
                                    encoge aunque el nombre sea largo. */}
                                <div className="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-gray-800 bg-gray-900">
                                    {membresia.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={membresia.photoUrl}
                                            alt={`Foto de ${jugador.name} ${jugador.lastName}`}
                                            loading="lazy"
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        // Respaldo con iniciales: sin esto, los
                                        // jugadores sin foto dejarían huecos.
                                        <div
                                            aria-hidden
                                            className="flex h-full w-full items-center justify-center bg-linear-to-br from-pink-500 to-yellow-500 text-lg font-bold text-white"
                                        >
                                            {iniciales}
                                        </div>
                                    )}
                                </div>

                                {/* --- Nombre y posiciones --- */}
                                {/* min-w-0 es lo que permite que `truncate`
                                    funcione dentro de un flex. */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-white">
                                        {jugador.name} {jugador.lastName}
                                    </p>
                                    <div className="mt-1 flex flex-wrap gap-1.5">
                                        {membresia.positions.map((posicion) => (
                                            <span
                                                key={posicion}
                                                title={etiquetaPosicion[posicion]}
                                                className="rounded-full border border-gray-700 px-2 py-0.5 text-[11px] font-semibold text-gray-300"
                                            >
                                                {posicion}
                                            </span>
                                        ))}
                                    </div>
                                </div>

                                {/* --- Número de camiseta --- */}
                                <span className="shrink-0 font-mono text-2xl font-bold text-pink-400">
                                    #{membresia.jerseyNumber}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Modal>
    );
}
