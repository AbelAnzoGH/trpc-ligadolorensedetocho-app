'use client';

import { useEffect, useState } from 'react';
import Modal from '@/components/modal';
import Avatar from '@/components/ui/avatar';
import Insignia from '@/components/ui/insignia';
import { Cargando, MensajeError, Vacio } from '@/components/ui/estado';
import { trpcQuery } from '@/utils/trpc-fetch';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TeamSeason } from '@/lib/season-ui';
import {
    etiquetaPosicion,
    type MembershipConJugador,
    type ListMembershipsResponse,
} from '@/lib/player-ui';

/**
 * Ventana emergente con el plantel de UNA inscripción (un equipo en una
 * temporada y categoría). El plantel no es del equipo: es de la inscripción.
 * Por eso "Patito" en LDT VII y en LDT VIII muestra jugadores distintos.
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
    inscripcion,
    temporada,
    onCerrar,
}: {
    /** La inscripción cuyo plantel se muestra, o null si no hay ninguna abierta. */
    inscripcion: TeamSeason | null;
    /** Nombre de la temporada para el subtítulo ("LDT VII"). */
    temporada?: string;
    onCerrar: () => void;
}) {
    const [jugadores, setJugadores] = useState<MembershipConJugador[]>([]);
    const [cargando, setCargando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        // Modal cerrado: no hay nada que pedir.
        if (!inscripcion) return;

        // `cancelado` evita el caso de "abro un equipo, lo cierro y abro otro
        // antes de que llegue la primera respuesta": sin esta bandera, la
        // respuesta vieja pisaría a la nueva. El return del useEffect la
        // enciende justo antes de que corra el efecto siguiente.
        let cancelado = false;

        setCargando(true);
        setError(null);
        setJugadores([]);

        trpcQuery<ListMembershipsResponse>('listMemberships', { teamSeasonId: inscripcion.id })
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
    }, [inscripcion]);

    return (
        <Modal
            abierto={inscripcion !== null}
            onCerrar={onCerrar}
            titulo={inscripcion?.team.name ?? ''}
            subtitulo={
                inscripcion
                    ? `${temporada ? `${temporada} · ` : ''}${etiquetaCategoria[inscripcion.category]}${
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
            {cargando && <Cargando texto="Cargando jugadores…" />}

            {/* ---------- Error ---------- */}
            {!cargando && error && <MensajeError>Error: {error}</MensajeError>}

            {/* ---------- Equipo sin jugadores ---------- */}
            {!cargando && !error && jugadores.length === 0 && (
                <Vacio>Este equipo todavía no tiene jugadores registrados en esta temporada.</Vacio>
            )}

            {/* ---------- Listado ---------- */}
            {!cargando && !error && jugadores.length > 0 && (
                <ul className="divide-y divide-borde">
                    {jugadores.map((membresia) => {
                        const { player: jugador } = membresia;

                        return (
                            <li key={membresia.id} className="flex items-center gap-4 py-3">
                                {/* --- Foto (o iniciales) --- */}
                                <Avatar
                                    src={membresia.photoUrl}
                                    nombre={jugador.name}
                                    apellido={jugador.lastName}
                                    tamano={52}
                                />

                                {/* --- Nombre y posiciones --- */}
                                {/* min-w-0 es lo que permite que `truncate`
                                    funcione dentro de un flex. */}
                                <div className="min-w-0 flex-1">
                                    <p className="truncate font-semibold text-tinta">
                                        {jugador.name} {jugador.lastName}
                                    </p>
                                    <div className="mt-1.5 flex flex-wrap gap-1.5">
                                        {membresia.positions.map((posicion) => (
                                            <Insignia key={posicion} tono="contorno" title={etiquetaPosicion[posicion]}>
                                                {posicion}
                                            </Insignia>
                                        ))}
                                    </div>
                                </div>

                                {/* --- Número de camiseta --- */}
                                {/* El "#" en apagado: el número es lo que se lee. */}
                                <span className="shrink-0 text-subtitulo font-bold tabular-nums text-tinta">
                                    <span className="text-apagado">#</span>
                                    {membresia.jerseyNumber}
                                </span>
                            </li>
                        );
                    })}
                </ul>
            )}
        </Modal>
    );
}
