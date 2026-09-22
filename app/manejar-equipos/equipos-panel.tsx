'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { subirImagen } from '@/utils/subir-imagen';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import { teamCategories, type TeamCategory } from '@/lib/team-schema';
import {
    etiquetaCategoria,
    inputClass,
    type Team,
    type ListTeamsResponse,
    type TeamResponse,
} from '@/lib/team-ui';
import SelectorImagen from '@/components/selector-imagen';

/**
 * Panel de administración de equipos: el CRUD completo, con logo opcional.
 * Solo se renderiza dentro de /manejar-equipos, que ya verificó la sesión
 * del lado del servidor antes de mostrar nada.
 *
 * Aquí se maneja el equipo como IDENTIDAD permanente (nombre y logo). La
 * categoría, el plantel y las estadísticas son de cada inscripción, y esas
 * se manejan en /manejar-temporadas. Como atajo, al crear un equipo nuevo
 * se puede inscribir de una vez en una temporada.
 */
export default function EquiposPanel() {
    const [equipos, setEquipos] = useState<Team[]>([]);
    const [cargando, setCargando] = useState(true);
    const [guardando, setGuardando] = useState(false);
    const [error, setError] = useState<string | null>(null);

    // Formulario. Si editandoId tiene valor, el formulario está en modo edición.
    const [editandoId, setEditandoId] = useState<string | null>(null);
    const [nombre, setNombre] = useState('');

    // --- Inscripción opcional al crear (solo en modo "nuevo") ---
    const { ligas, seasonId, setSeasonId } = useLigas();
    const [inscribir, setInscribir] = useState(true);
    const [categoria, setCategoria] = useState<TeamCategory>('varonil');

    // --- Estado del logo ---
    // archivoLogo  : lo que el usuario acaba de elegir y aún NO se ha subido
    // logoActual   : lo que se está mostrando en la vista previa
    // logoOriginal : lo que el equipo tenía cuando empezamos a editarlo
    // Los últimos dos se comparan al guardar para saber si el usuario quitó
    // el logo (había uno, ahora no hay, y tampoco eligió uno nuevo).
    const [archivoLogo, setArchivoLogo] = useState<File | null>(null);
    const [logoActual, setLogoActual] = useState<string | null>(null);
    const [logoOriginal, setLogoOriginal] = useState<string | null>(null);

    const cargarEquipos = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            const data = await trpcQuery<ListTeamsResponse>('listTeams');
            setEquipos(data.data.teams);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargarEquipos();
    }, [cargarEquipos]);

    const limpiarFormulario = () => {
        setEditandoId(null);
        setNombre('');
        setArchivoLogo(null);
        setLogoActual(null);
        setLogoOriginal(null);
    };

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            toast.error('El nombre del equipo es requerido');
            return;
        }

        setGuardando(true);
        try {
            // PASO 1 — Si hay archivo nuevo, primero se sube. Va antes de
            // tocar la base de datos: si la subida falla, el equipo se queda
            // como estaba en vez de apuntar a una imagen que no existe.
            let logo: { logoUrl?: string | null; logoKey?: string | null } = {};

            if (archivoLogo) {
                const subida = await subirImagen(archivoLogo);
                logo = { logoUrl: subida.url, logoKey: subida.key };
            } else if (editandoId && logoOriginal && !logoActual) {
                // Había logo, el usuario lo quitó y no eligió otro: se manda
                // null explícito para que el backend lo borre.
                logo = { logoUrl: null, logoKey: null };
            }
            // Si no entra en ningún caso, `logo` queda vacío y el backend
            // no toca el logo existente.

            // PASO 2 — Guardar el equipo con la dirección de la imagen.
            if (editandoId) {
                await trpcMutation<TeamResponse>('updateTeam', {
                    id: editandoId,
                    name: nombre.trim(),
                    ...logo,
                });
                toast.success('Equipo actualizado');
            } else {
                const conInscripcion = inscribir && seasonId;
                await trpcMutation<TeamResponse>('createTeam', {
                    name: nombre.trim(),
                    ...logo,
                    inscripcion: conInscripcion ? { seasonId, category: categoria } : undefined,
                });
                toast.success(conInscripcion ? 'Equipo creado e inscrito' : 'Equipo creado');
            }

            limpiarFormulario();
            await cargarEquipos();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const onEditar = (equipo: Team) => {
        setEditandoId(equipo.id);
        setNombre(equipo.name);
        setArchivoLogo(null);
        setLogoActual(equipo.logoUrl);
        setLogoOriginal(equipo.logoUrl);
    };

    const onEliminar = async (equipo: Team) => {
        setGuardando(true);
        try {
            await trpcMutation('deleteTeam', { id: equipo.id });
            toast.success(`Equipo "${equipo.name}" eliminado`);
            if (editandoId === equipo.id) limpiarFormulario();
            await cargarEquipos();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="space-y-8">
            {/* ---------- Formulario crear / editar ---------- */}
            <form
                onSubmit={onSubmit}
                className="space-y-4 rounded-lg border border-gray-800 bg-gray-900/40 p-6"
            >
                <h2 className="text-xl font-semibold text-white">
                    {editandoId ? 'Editar equipo' : 'Nuevo equipo'}
                </h2>

                <div className="flex flex-col gap-1">
                    <label htmlFor="nombre" className="text-sm text-gray-300">Nombre</label>
                    <input
                        id="nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className={inputClass}
                        placeholder="Ej. Halcones"
                    />
                </div>

                {/* La inscripción solo aplica al CREAR: para inscribir a un
                    equipo existente en otra temporada está /manejar-temporadas. */}
                {!editandoId && (
                    <fieldset className="space-y-3 rounded-md border border-gray-800 p-4">
                        <label className="flex items-center gap-2 text-sm text-gray-300">
                            <input
                                type="checkbox"
                                checked={inscribir}
                                onChange={(e) => setInscribir(e.target.checked)}
                                className="accent-pink-500"
                            />
                            Inscribirlo de una vez en una temporada
                        </label>

                        {inscribir && (
                            <div className="flex flex-wrap items-end gap-3">
                                <SelectorTemporada
                                    ligas={ligas}
                                    seasonId={seasonId}
                                    onChange={setSeasonId}
                                    idPrefix="nuevo"
                                />
                                <div className="flex flex-col gap-1">
                                    <label htmlFor="categoria" className="text-sm text-gray-300">Categoría</label>
                                    <select
                                        id="categoria"
                                        value={categoria}
                                        onChange={(e) => setCategoria(e.target.value as TeamCategory)}
                                        className={inputClass}
                                    >
                                        {teamCategories.map((c) => (
                                            <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        )}
                    </fieldset>
                )}

                <SelectorImagen
                    archivo={archivoLogo}
                    urlActual={logoActual}
                    onSeleccionar={setArchivoLogo}
                    onQuitar={() => {
                        setArchivoLogo(null);
                        setLogoActual(null);
                    }}
                />

                <div className="flex gap-2">
                    <button
                        type="submit"
                        disabled={guardando}
                        className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-5 py-2 font-semibold text-white transition duration-300 hover:bg-linear-to-l disabled:opacity-50"
                    >
                        {guardando
                            ? 'Guardando...'
                            : editandoId
                              ? 'Guardar cambios'
                              : 'Crear equipo'}
                    </button>

                    {editandoId && (
                        <button
                            type="button"
                            onClick={limpiarFormulario}
                            className="rounded-full border border-gray-600 px-5 py-2 font-semibold text-gray-300 hover:text-white"
                        >
                            Cancelar
                        </button>
                    )}
                </div>
            </form>

            {/* ---------- Listado administrable ---------- */}
            <div>
                <h2 className="mb-3 text-xl font-semibold text-white">
                    Equipos registrados{' '}
                    {!cargando && !error && (
                        <span className="text-base font-normal text-gray-500">({equipos.length})</span>
                    )}
                </h2>

                {cargando && <p className="text-gray-300">Cargando equipos...</p>}
                {error && <p className="text-red-400">Error: {error}</p>}

                {!cargando && !error && equipos.length === 0 && (
                    <p className="text-gray-400">
                        Todavía no hay equipos. Crea el primero con el formulario de arriba.
                    </p>
                )}

                {!cargando && !error && equipos.length > 0 && (
                    <ul className="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800">
                        {equipos.map((equipo) => (
                            <li
                                key={equipo.id}
                                className="flex items-center justify-between gap-3 bg-gray-900/40 p-4"
                            >
                                <span className="flex min-w-0 items-center gap-3">
                                    <span className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-md border border-gray-800 bg-gray-950/60">
                                        {equipo.logoUrl ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img
                                                src={equipo.logoUrl}
                                                alt=""
                                                className="h-full w-full object-contain"
                                            />
                                        ) : (
                                            <span className="text-[9px] uppercase text-gray-600">
                                                s/l
                                            </span>
                                        )}
                                    </span>

                                    <span className="min-w-0 truncate">
                                        <strong className="text-white">{equipo.name}</strong>{' '}
                                        <span className="text-sm text-gray-400">
                                            ({equipo._count.teamSeasons === 0
                                                ? 'sin inscripciones'
                                                : `${equipo._count.teamSeasons} ${equipo._count.teamSeasons === 1 ? 'inscripción' : 'inscripciones'}`})
                                        </span>
                                    </span>
                                </span>

                                <span className="flex shrink-0 gap-2">
                                    <button
                                        type="button"
                                        onClick={() => onEditar(equipo)}
                                        className="rounded-full border border-gray-600 px-4 py-1 text-sm text-gray-300 hover:text-white"
                                    >
                                        Editar
                                    </button>
                                    {/* Un equipo con historial no se borra (el backend
                                        lo rechaza); ni siquiera se ofrece el botón. */}
                                    {equipo._count.teamSeasons === 0 && (
                                    <button
                                        type="button"
                                        onClick={() => onEliminar(equipo)}
                                        disabled={guardando}
                                        className="rounded-full border border-red-500/60 px-4 py-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                                    >
                                        Eliminar
                                    </button>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}
