'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { trpcMutation } from '@/utils/trpc-fetch';
import { subirImagen } from '@/utils/subir-imagen';
import type { PlayerPosition } from '@/lib/player-schema';
import { inputClass, etiquetaCategoria } from '@/lib/team-ui';
import { nombreTemporada, type TeamSeason } from '@/lib/season-ui';
import {
    camposEstadistica,
    type Player,
    type Membership,
    type CampoEstadistica,
} from '@/lib/player-ui';
import PosicionesCheckboxes from './posiciones-checkboxes';
import SelectorImagen from '@/components/selector-imagen';

/**
 * Una tarjeta por PERSONA. Adentro se administra:
 *  - sus datos personales (nombre, apellido, edad, altura)
 *  - su historial de participaciones (equipo + temporada + categoría), cada
 *    una con su jersey, posiciones, estadísticas y FOTO propios
 *  - el alta en un equipo de la temporada de trabajo
 *
 * `onCambio` es la función que recarga la lista completa desde el panel padre.
 * Se llama después de cada operación exitosa para que la pantalla no se
 * quede mostrando datos viejos.
 */
export default function JugadorCard({
    jugador,
    inscripciones,
    seasonId,
    temporada,
    onCambio,
}: {
    jugador: Player;
    /** Las inscripciones de la temporada de trabajo. */
    inscripciones: TeamSeason[];
    /** Id de la temporada de trabajo (para resaltar sus membresías). */
    seasonId: string;
    /** Nombre de la temporada de trabajo, para los textos ("LDT VIII"). */
    temporada: string;
    onCambio: () => Promise<void>;
}) {
    const [guardando, setGuardando] = useState(false);

    // --- edición de la persona ---
    const [editandoPersona, setEditandoPersona] = useState(false);
    const [nombre, setNombre] = useState(jugador.name);
    const [apellido, setApellido] = useState(jugador.lastName);
    const [edad, setEdad] = useState(String(jugador.age));
    const [altura, setAltura] = useState(String(jugador.height));

    // --- alta en un equipo nuevo ---
    const [agregandoEquipo, setAgregandoEquipo] = useState(false);
    const [equipoId, setEquipoId] = useState('');
    const [jersey, setJersey] = useState('');
    const [posiciones, setPosiciones] = useState<PlayerPosition[]>([]);
    // Foto elegida para el alta. Todavía no se ha subido: viaja al servidor
    // hasta que se confirma el formulario.
    const [archivoFotoNueva, setArchivoFotoNueva] = useState<File | null>(null);

    // --- edición de una membresía existente ---
    const [editandoMembresia, setEditandoMembresia] = useState<Membership | null>(null);
    // Foto recién elegida durante la edición (aún sin subir).
    const [archivoFotoEdicion, setArchivoFotoEdicion] = useState<File | null>(null);
    // La foto que la membresía tenía al empezar a editarla. Se compara contra
    // `editandoMembresia.photoUrl` para distinguir "el usuario quitó la foto"
    // de "el usuario no tocó la foto": son dos cosas distintas para el backend.
    const [fotoOriginal, setFotoOriginal] = useState<string | null>(null);

    // Inscripciones de la temporada de trabajo en las que TODAVÍA no juega.
    // También se esconden las de una categoría en la que ya juega con otro
    // equipo esta temporada: el backend las rechazaría (regla de la liga).
    const categoriasOcupadas = new Set(
        jugador.memberships
            .filter((m) => m.teamSeason.season.id === seasonId)
            .map((m) => m.teamSeason.category),
    );
    const equiposDisponibles = inscripciones.filter(
        (i) =>
            !jugador.memberships.some((m) => m.teamSeasonId === i.id) &&
            !categoriasOcupadas.has(i.category),
    );

    // "LDT VII · Patito (Varonil)": así se nombra una membresía en pantalla.
    const etiquetaMembresia = (m: Membership) =>
        `${nombreTemporada(m.teamSeason.season.league, m.teamSeason.season.number)} · ${m.teamSeason.team.name}`;

    const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
        setGuardando(true);
        try {
            await accion();
            toast.success(exito);
            await onCambio();
            return true;
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
            return false;
        } finally {
            setGuardando(false);
        }
    };

    const onGuardarPersona = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim() || !apellido.trim()) {
            toast.error('Nombre y apellido son requeridos');
            return;
        }

        const ok = await ejecutar(
            () =>
                trpcMutation('updatePlayer', {
                    id: jugador.id,
                    name: nombre.trim(),
                    lastName: apellido.trim(),
                    age: Number(edad),
                    height: Number(altura),
                }),
            'Jugador actualizado',
        );

        if (ok) setEditandoPersona(false);
    };

    const onEliminarPersona = () =>
        ejecutar(
            () => trpcMutation('deletePlayer', { id: jugador.id }),
            `${jugador.name} ${jugador.lastName} eliminado`,
        );

    const onAgregarAEquipo = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!equipoId) {
            toast.error('Selecciona un equipo');
            return;
        }
        if (posiciones.length === 0) {
            toast.error('Selecciona al menos una posición');
            return;
        }

        const ok = await ejecutar(async () => {
            // PASO 1 — Si hay foto, primero se sube al almacenamiento.
            // Va antes de tocar la base de datos: si la subida falla, la
            // membresía no se crea apuntando a una imagen inexistente.
            let foto: { photoUrl?: string; photoKey?: string } = {};

            if (archivoFotoNueva) {
                const subida = await subirImagen(archivoFotoNueva, 'jugadores');
                foto = { photoUrl: subida.url, photoKey: subida.key };
            }

            // PASO 2 — Crear la membresía con la dirección que devolvió la subida.
            return trpcMutation('addPlayerToTeam', {
                playerId: jugador.id,
                teamSeasonId: equipoId,
                jerseyNumber: Number(jersey),
                positions: posiciones,
                ...foto,
            });
        }, 'Jugador agregado al equipo');

        if (ok) {
            setAgregandoEquipo(false);
            setEquipoId('');
            setJersey('');
            setPosiciones([]);
            setArchivoFotoNueva(null);
        }
    };

    const onEditarMembresia = (membresia: Membership) => {
        setEditandoMembresia(membresia);
        setArchivoFotoEdicion(null);
        setFotoOriginal(membresia.photoUrl);
    };

    const onGuardarMembresia = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editandoMembresia) return;

        if (editandoMembresia.positions.length === 0) {
            toast.error('Selecciona al menos una posición');
            return;
        }

        const membresia = editandoMembresia; // copia estable para el closure

        const ok = await ejecutar(async () => {
            // Tres situaciones posibles con la foto, y cada una manda algo
            // distinto (o nada) al backend:
            let foto: { photoUrl?: string | null; photoKey?: string | null } = {};

            if (archivoFotoEdicion) {
                // a) Eligió una foto nueva → se sube y se manda la dirección.
                const subida = await subirImagen(archivoFotoEdicion, 'jugadores');
                foto = { photoUrl: subida.url, photoKey: subida.key };
            } else if (fotoOriginal && !membresia.photoUrl) {
                // b) Había foto y la quitó → null explícito para que el
                //    backend la borre del disco y limpie las columnas.
                foto = { photoUrl: null, photoKey: null };
            }
            // c) No tocó la foto → `foto` queda vacío y el backend no la toca.

            return trpcMutation('updateMembership', {
                id: membresia.id,
                jerseyNumber: membresia.jerseyNumber,
                positions: membresia.positions,
                touchdowns: membresia.touchdowns,
                touchdownPasses: membresia.touchdownPasses,
                interceptions: membresia.interceptions,
                safeties: membresia.safeties,
                gamesPlayed: membresia.gamesPlayed,
                availableForPlayoffs: membresia.availableForPlayoffs,
                ...foto,
            });
        }, 'Membresía actualizada');

        if (ok) {
            setEditandoMembresia(null);
            setArchivoFotoEdicion(null);
            setFotoOriginal(null);
        }
    };

    const onQuitarDeEquipo = (membresia: Membership) =>
        ejecutar(
            () => trpcMutation('removeMembership', { id: membresia.id }),
            `Quitado de ${membresia.teamSeason.team.name}`,
        );

    return (
        <li className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-5">
            {/* ================= Datos de la persona ================= */}
            {editandoPersona ? (
                <form onSubmit={onGuardarPersona} className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className={inputClass}
                            placeholder="Nombre"
                            aria-label="Nombre"
                        />
                        <input
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            className={inputClass}
                            placeholder="Apellido"
                            aria-label="Apellido"
                        />
                        <input
                            type="number"
                            value={edad}
                            onChange={(e) => setEdad(e.target.value)}
                            className={inputClass}
                            placeholder="Edad"
                            aria-label="Edad"
                        />
                        <input
                            type="number"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            className={inputClass}
                            placeholder="Altura (cm)"
                            aria-label="Altura en centímetros"
                        />
                    </div>

                    {/* La foto NO se edita aquí: pertenece a la membresía,
                        no a la persona. Cada equipo tiene la suya. */}

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            Guardar
                        </button>
                        <button
                            type="button"
                            onClick={() => setEditandoPersona(false)}
                            className="rounded-full border border-gray-600 px-4 py-1.5 text-sm text-gray-300 hover:text-white"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                        <h3 className="text-lg font-semibold text-white">
                            {jugador.name} {jugador.lastName}
                        </h3>
                        <p className="text-sm text-gray-400">
                            {jugador.age} años · {jugador.height} cm ·{' '}
                            {jugador.memberships.length === 0
                                ? 'sin equipo'
                                : `${jugador.memberships.length} ${jugador.memberships.length === 1 ? 'participación' : 'participaciones'}`}
                        </p>
                    </div>
                    <div className="flex gap-2">
                        <button
                            type="button"
                            onClick={() => setEditandoPersona(true)}
                            className="rounded-full border border-gray-600 px-4 py-1 text-sm text-gray-300 hover:text-white"
                        >
                            Editar datos
                        </button>
                        <button
                            type="button"
                            onClick={onEliminarPersona}
                            disabled={guardando}
                            className="rounded-full border border-red-500/60 px-4 py-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                        >
                            Eliminar
                        </button>
                    </div>
                </div>
            )}

            {/* ================= Membresías ================= */}
            <div className="space-y-2">
                {jugador.memberships.length === 0 && !agregandoEquipo && (
                    <p className="text-sm text-gray-500">
                        Todavía no juega en ningún equipo.
                    </p>
                )}

                {jugador.memberships.map((membresia) =>
                    editandoMembresia?.id === membresia.id ? (
                        /* ---- Formulario de edición de la membresía ---- */
                        <form
                            key={membresia.id}
                            onSubmit={onGuardarMembresia}
                            className="space-y-4 rounded-md border border-pink-500/40 bg-gray-950/60 p-4"
                        >
                            <p className="font-semibold text-white">
                                {etiquetaMembresia(membresia)}{' '}
                                <span className="text-sm font-normal text-gray-400">
                                    ({etiquetaCategoria[membresia.teamSeason.category]})
                                </span>
                            </p>

                            {/* Quitar la foto aquí solo la borra de la vista previa;
                                el borrado real ocurre al guardar el formulario. */}
                            <SelectorImagen
                                etiqueta="Foto con este uniforme"
                                archivo={archivoFotoEdicion}
                                urlActual={editandoMembresia.photoUrl}
                                onSeleccionar={setArchivoFotoEdicion}
                                onQuitar={() => {
                                    setArchivoFotoEdicion(null);
                                    setEditandoMembresia({ ...editandoMembresia, photoUrl: null });
                                }}
                            />

                            <div className="flex flex-col gap-1">
                                <label className="text-sm text-gray-300">Número de jersey</label>
                                <input
                                    type="number"
                                    value={editandoMembresia.jerseyNumber}
                                    onChange={(e) =>
                                        setEditandoMembresia({
                                            ...editandoMembresia,
                                            jerseyNumber: Number(e.target.value),
                                        })
                                    }
                                    className={`${inputClass} w-28`}
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-300">Posiciones</label>
                                <PosicionesCheckboxes
                                    value={editandoMembresia.positions}
                                    onChange={(positions) =>
                                        setEditandoMembresia({ ...editandoMembresia, positions })
                                    }
                                />
                            </div>

                            <div className="flex flex-col gap-2">
                                <label className="text-sm text-gray-300">
                                    Estadísticas en este equipo, esta temporada
                                </label>
                                <div className="grid gap-3 sm:grid-cols-3">
                                    {camposEstadistica.map((campo) => (
                                        <div key={campo.key} className="flex flex-col gap-1">
                                            <label
                                                htmlFor={`${membresia.id}-${campo.key}`}
                                                className="text-xs text-gray-500"
                                            >
                                                {campo.label}
                                            </label>
                                            <input
                                                id={`${membresia.id}-${campo.key}`}
                                                type="number"
                                                value={editandoMembresia[campo.key as CampoEstadistica]}
                                                onChange={(e) =>
                                                    setEditandoMembresia({
                                                        ...editandoMembresia,
                                                        [campo.key]: Number(e.target.value),
                                                    })
                                                }
                                                className={inputClass}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <label className="flex items-center gap-2 text-sm text-gray-300">
                                <input
                                    type="checkbox"
                                    checked={editandoMembresia.availableForPlayoffs}
                                    onChange={(e) =>
                                        setEditandoMembresia({
                                            ...editandoMembresia,
                                            availableForPlayoffs: e.target.checked,
                                        })
                                    }
                                    className="h-4 w-4 accent-pink-500"
                                />
                                Disponible para playoffs
                            </label>

                            <div className="flex gap-2">
                                <button
                                    type="submit"
                                    disabled={guardando}
                                    className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                                >
                                    {guardando ? 'Guardando...' : 'Guardar'}
                                </button>
                                <button
                                    type="button"
                                    onClick={() => {
                                        setEditandoMembresia(null);
                                        setArchivoFotoEdicion(null);
                                    }}
                                    className="rounded-full border border-gray-600 px-4 py-1.5 text-sm text-gray-300 hover:text-white"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* ---- Vista compacta de la membresía ---- */
                        <div
                            key={membresia.id}
                            // Las membresías de OTRAS temporadas son historial:
                            // se ven atenuadas para no confundirlas con las actuales.
                            className={`flex flex-wrap items-center justify-between gap-3 rounded-md border border-gray-800 bg-gray-950/40 p-3 ${
                                membresia.teamSeason.season.id === seasonId ? '' : 'opacity-60'
                            }`}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                <span className="flex h-12 w-12 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-950/60">
                                    {membresia.photoUrl ? (
                                        // eslint-disable-next-line @next/next/no-img-element
                                        <img
                                            src={membresia.photoUrl}
                                            alt=""
                                            className="h-full w-full object-cover"
                                        />
                                    ) : (
                                        <span className="text-[9px] uppercase text-gray-600">s/f</span>
                                    )}
                                </span>

                                <div className="min-w-0 space-y-1">
                                    <p className="text-white">
                                        <span className="font-mono text-pink-400">
                                            #{membresia.jerseyNumber}
                                        </span>{' '}
                                        <span className="font-semibold">{etiquetaMembresia(membresia)}</span>{' '}
                                        <span className="text-sm text-gray-400">
                                            ({etiquetaCategoria[membresia.teamSeason.category]})
                                        </span>{' '}
                                        <span className="text-sm text-gray-500">
                                            · {membresia.positions.join(' / ')}
                                        </span>
                                    </p>
                                    <p className="text-xs text-gray-500">
                                        {camposEstadistica
                                            .map((c) => `${c.label}: ${membresia[c.key as CampoEstadistica]}`)
                                            .join(' · ')}
                                        {membresia.availableForPlayoffs
                                            ? ' · ✅ playoffs'
                                            : ' · ❌ playoffs'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-2">
                                <button
                                    type="button"
                                    onClick={() => onEditarMembresia(membresia)}
                                    className="rounded-full border border-gray-600 px-3 py-1 text-sm text-gray-300 hover:text-white"
                                >
                                    Editar
                                </button>
                                <button
                                    type="button"
                                    onClick={() => onQuitarDeEquipo(membresia)}
                                    disabled={guardando}
                                    className="rounded-full border border-red-500/60 px-3 py-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                                >
                                    Quitar
                                </button>
                            </div>
                        </div>
                    ),
                )}
            </div>

            {/* ================= Alta en un equipo nuevo ================= */}
            {agregandoEquipo ? (
                <form
                    onSubmit={onAgregarAEquipo}
                    className="space-y-4 rounded-md border border-gray-700 bg-gray-950/60 p-4"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-300">Equipo en {temporada}</label>
                            <select
                                value={equipoId}
                                onChange={(e) => setEquipoId(e.target.value)}
                                className={inputClass}
                            >
                                <option value="">Selecciona un equipo</option>
                                {equiposDisponibles.map((inscripcion) => (
                                    <option key={inscripcion.id} value={inscripcion.id}>
                                        {inscripcion.team.name} ({etiquetaCategoria[inscripcion.category]})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex flex-col gap-1">
                            <label className="text-sm text-gray-300">Número de jersey</label>
                            <input
                                type="number"
                                value={jersey}
                                onChange={(e) => setJersey(e.target.value)}
                                className={inputClass}
                                placeholder="Ej. 7"
                            />
                        </div>
                    </div>

                    <div className="flex flex-col gap-2">
                        <label className="text-sm text-gray-300">Posiciones</label>
                        <PosicionesCheckboxes value={posiciones} onChange={setPosiciones} />
                    </div>

                    <SelectorImagen
                        etiqueta="Foto con este uniforme"
                        archivo={archivoFotoNueva}
                        urlActual={null}
                        onSeleccionar={setArchivoFotoNueva}
                        onQuitar={() => setArchivoFotoNueva(null)}
                    />

                    <div className="flex gap-2">
                        <button
                            type="submit"
                            disabled={guardando}
                            className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-50"
                        >
                            {guardando ? 'Guardando...' : 'Agregar'}
                        </button>
                        <button
                            type="button"
                            onClick={() => {
                                setAgregandoEquipo(false);
                                setArchivoFotoNueva(null);
                            }}
                            className="rounded-full border border-gray-600 px-4 py-1.5 text-sm text-gray-300 hover:text-white"
                        >
                            Cancelar
                        </button>
                    </div>
                </form>
            ) : (
                equiposDisponibles.length > 0 && (
                    <button
                        type="button"
                        onClick={() => setAgregandoEquipo(true)}
                        className="text-sm font-semibold text-pink-500 hover:text-pink-400"
                    >
                        + Agregar a un equipo de {temporada}
                    </button>
                )
            )}
        </li>
    );
}
