'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { trpcMutation } from '@/utils/trpc-fetch';
import { subirImagen } from '@/utils/subir-imagen';
import type { PlayerPosition } from '@/lib/player-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import { cn } from '@/lib/cn';
import Avatar from '@/components/ui/avatar';
import Boton from '@/components/ui/boton';
import Insignia from '@/components/ui/insignia';
import Tarjeta from '@/components/ui/tarjeta';
import { claseCampo, claseCasilla, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseAccionesFila } from '@/components/ui/lista';
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

    // Todos los campos de esta tarjeta ocupan su celda completa.
    const campo = `${claseCampo} w-full`;

    return (
        <Tarjeta variante="panel" as="li" className="space-y-5">
            {/* ================= Datos de la persona ================= */}
            {editandoPersona ? (
                <form onSubmit={onGuardarPersona} className="space-y-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                        <input
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className={campo}
                            placeholder="Nombre"
                            aria-label="Nombre"
                        />
                        <input
                            value={apellido}
                            onChange={(e) => setApellido(e.target.value)}
                            className={campo}
                            placeholder="Apellido"
                            aria-label="Apellido"
                        />
                        <input
                            type="number"
                            value={edad}
                            onChange={(e) => setEdad(e.target.value)}
                            className={campo}
                            placeholder="Edad"
                            aria-label="Edad"
                        />
                        <input
                            type="number"
                            value={altura}
                            onChange={(e) => setAltura(e.target.value)}
                            className={campo}
                            placeholder="Altura (cm)"
                            aria-label="Altura en centímetros"
                        />
                    </div>

                    {/* La foto NO se edita aquí: pertenece a la membresía,
                        no a la persona. Cada equipo tiene la suya. */}

                    <div className="flex flex-wrap gap-2">
                        <Boton type="submit" tamano="sm" disabled={guardando}>
                            Guardar
                        </Boton>
                        <Boton variante="secundario" tamano="sm" onClick={() => setEditandoPersona(false)}>
                            Cancelar
                        </Boton>
                    </div>
                </form>
            ) : (
                <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                        <h3 className="text-cuerpo-lg font-semibold text-tinta">
                            {jugador.name} {jugador.lastName}
                        </h3>
                        <p className="text-meta text-tenue">
                            {jugador.age} años · {jugador.height} cm ·{' '}
                            {jugador.memberships.length === 0
                                ? 'sin equipo'
                                : `${jugador.memberships.length} ${jugador.memberships.length === 1 ? 'participación' : 'participaciones'}`}
                        </p>
                    </div>
                    <div className={claseAccionesFila}>
                        <Boton variante="fantasma" tamano="sm" onClick={() => setEditandoPersona(true)}>
                            Editar datos
                        </Boton>
                        <Boton variante="peligro" tamano="sm" onClick={onEliminarPersona} disabled={guardando}>
                            Eliminar
                        </Boton>
                    </div>
                </div>
            )}

            {/* ================= Membresías ================= */}
            <div className="space-y-2">
                {jugador.memberships.length === 0 && !agregandoEquipo && (
                    <p className="text-meta text-tenue">Todavía no juega en ningún equipo.</p>
                )}

                {jugador.memberships.map((membresia) =>
                    editandoMembresia?.id === membresia.id ? (
                        /* ---- Formulario de edición de la membresía ---- */
                        /* Sub-formulario dentro de la tarjeta: fondo canvas
                           (hundido) y borde fuerte, para que se vea que es
                           lo que se está editando ahora. */
                        <form
                            key={membresia.id}
                            onSubmit={onGuardarMembresia}
                            className="space-y-5 rounded-item border border-borde-fuerte bg-canvas p-4"
                        >
                            <p className="font-semibold text-tinta">
                                {etiquetaMembresia(membresia)}{' '}
                                <span className="text-meta font-normal text-tenue">
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

                            <div className={claseGrupoCampo}>
                                <label htmlFor={`${membresia.id}-jersey`} className={claseEtiqueta}>
                                    Número de jersey
                                </label>
                                <input
                                    id={`${membresia.id}-jersey`}
                                    type="number"
                                    value={editandoMembresia.jerseyNumber}
                                    onChange={(e) =>
                                        setEditandoMembresia({
                                            ...editandoMembresia,
                                            jerseyNumber: Number(e.target.value),
                                        })
                                    }
                                    className={`${claseCampo} w-28`}
                                />
                            </div>

                            <div className={claseGrupoCampo}>
                                <span className={claseEtiqueta}>Posiciones</span>
                                <PosicionesCheckboxes
                                    value={editandoMembresia.positions}
                                    onChange={(positions) =>
                                        setEditandoMembresia({ ...editandoMembresia, positions })
                                    }
                                />
                            </div>

                            <fieldset className={claseGrupoCampo}>
                                <legend className={`${claseEtiqueta} mb-2`}>
                                    Estadísticas en este equipo, esta temporada
                                </legend>
                                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                                    {camposEstadistica.map((c) => (
                                        <div key={c.key} className="flex flex-col gap-1.5">
                                            <label
                                                htmlFor={`${membresia.id}-${c.key}`}
                                                className="text-leyenda text-tenue"
                                            >
                                                {c.label}
                                            </label>
                                            <input
                                                id={`${membresia.id}-${c.key}`}
                                                type="number"
                                                value={editandoMembresia[c.key as CampoEstadistica]}
                                                onChange={(e) =>
                                                    setEditandoMembresia({
                                                        ...editandoMembresia,
                                                        [c.key]: Number(e.target.value),
                                                    })
                                                }
                                                className={`${campo} tabular-nums`}
                                            />
                                        </div>
                                    ))}
                                </div>
                            </fieldset>

                            <label className="flex items-center gap-2.5 text-meta text-tinta-2">
                                <input
                                    type="checkbox"
                                    checked={editandoMembresia.availableForPlayoffs}
                                    onChange={(e) =>
                                        setEditandoMembresia({
                                            ...editandoMembresia,
                                            availableForPlayoffs: e.target.checked,
                                        })
                                    }
                                    className={claseCasilla}
                                />
                                Disponible para playoffs
                            </label>

                            <div className="flex flex-wrap gap-2">
                                <Boton type="submit" tamano="sm" disabled={guardando}>
                                    {guardando ? 'Guardando…' : 'Guardar'}
                                </Boton>
                                <Boton
                                    variante="secundario"
                                    tamano="sm"
                                    onClick={() => {
                                        setEditandoMembresia(null);
                                        setArchivoFotoEdicion(null);
                                    }}
                                >
                                    Cancelar
                                </Boton>
                            </div>
                        </form>
                    ) : (
                        /* ---- Vista compacta de la membresía ---- */
                        <div
                            key={membresia.id}
                            // Las membresías de OTRAS temporadas son historial:
                            // se ven atenuadas para no confundirlas con las actuales.
                            className={cn(
                                'flex flex-wrap items-center justify-between gap-3 rounded-item border border-borde bg-canvas p-3',
                                membresia.teamSeason.season.id !== seasonId && 'opacity-60',
                            )}
                        >
                            <div className="flex min-w-0 items-center gap-3">
                                {/* La misma foto redonda que en el plantel público. */}
                                <Avatar
                                    src={membresia.photoUrl}
                                    nombre={jugador.name}
                                    apellido={jugador.lastName}
                                    tamano={44}
                                />

                                <div className="min-w-0 space-y-1.5">
                                    <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
                                        <span className="font-bold tabular-nums text-tinta">
                                            <span className="text-apagado">#</span>
                                            {membresia.jerseyNumber}
                                        </span>
                                        <span className="font-semibold text-tinta">{etiquetaMembresia(membresia)}</span>
                                        <Insignia>{etiquetaCategoria[membresia.teamSeason.category]}</Insignia>
                                        <span className="text-meta text-tenue">{membresia.positions.join(' / ')}</span>
                                    </p>
                                    <p className="text-leyenda tabular-nums text-tenue">
                                        {camposEstadistica
                                            .map((c) => `${c.label}: ${membresia[c.key as CampoEstadistica]}`)
                                            .join(' · ')}
                                    </p>
                                    {/* Como en la tarjeta pública: solo se avisa lo que NO es normal. */}
                                    {!membresia.availableForPlayoffs && (
                                        <Insignia tono="peligro">No disponible para playoffs</Insignia>
                                    )}
                                </div>
                            </div>

                            <div className={claseAccionesFila}>
                                <Boton variante="fantasma" tamano="sm" onClick={() => onEditarMembresia(membresia)}>
                                    Editar
                                </Boton>
                                <Boton
                                    variante="peligro"
                                    tamano="sm"
                                    onClick={() => onQuitarDeEquipo(membresia)}
                                    disabled={guardando}
                                >
                                    Quitar
                                </Boton>
                            </div>
                        </div>
                    ),
                )}
            </div>

            {/* ================= Alta en un equipo nuevo ================= */}
            {agregandoEquipo ? (
                <form
                    onSubmit={onAgregarAEquipo}
                    className="space-y-5 rounded-item border border-borde-fuerte bg-canvas p-4"
                >
                    <div className="grid gap-3 sm:grid-cols-2">
                        <div className={claseGrupoCampo}>
                            <label htmlFor={`${jugador.id}-equipo`} className={claseEtiqueta}>
                                Equipo en {temporada}
                            </label>
                            <select
                                id={`${jugador.id}-equipo`}
                                value={equipoId}
                                onChange={(e) => setEquipoId(e.target.value)}
                                className={campo}
                            >
                                <option value="">Selecciona un equipo</option>
                                {equiposDisponibles.map((inscripcion) => (
                                    <option key={inscripcion.id} value={inscripcion.id}>
                                        {inscripcion.team.name} ({etiquetaCategoria[inscripcion.category]})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className={claseGrupoCampo}>
                            <label htmlFor={`${jugador.id}-jersey`} className={claseEtiqueta}>
                                Número de jersey
                            </label>
                            <input
                                id={`${jugador.id}-jersey`}
                                type="number"
                                value={jersey}
                                onChange={(e) => setJersey(e.target.value)}
                                className={campo}
                                placeholder="Ej. 7"
                            />
                        </div>
                    </div>

                    <div className={claseGrupoCampo}>
                        <span className={claseEtiqueta}>Posiciones</span>
                        <PosicionesCheckboxes value={posiciones} onChange={setPosiciones} />
                    </div>

                    <SelectorImagen
                        etiqueta="Foto con este uniforme"
                        archivo={archivoFotoNueva}
                        urlActual={null}
                        onSeleccionar={setArchivoFotoNueva}
                        onQuitar={() => setArchivoFotoNueva(null)}
                    />

                    <div className="flex flex-wrap gap-2">
                        <Boton type="submit" tamano="sm" disabled={guardando}>
                            {guardando ? 'Guardando…' : 'Agregar'}
                        </Boton>
                        <Boton
                            variante="secundario"
                            tamano="sm"
                            onClick={() => {
                                setAgregandoEquipo(false);
                                setArchivoFotoNueva(null);
                            }}
                        >
                            Cancelar
                        </Boton>
                    </div>
                </form>
            ) : (
                equiposDisponibles.length > 0 && (
                    <Boton variante="secundario" tamano="sm" onClick={() => setAgregandoEquipo(true)}>
                        <span aria-hidden>+</span> Agregar a un equipo de {temporada}
                    </Boton>
                )
            )}
        </Tarjeta>
    );
}
