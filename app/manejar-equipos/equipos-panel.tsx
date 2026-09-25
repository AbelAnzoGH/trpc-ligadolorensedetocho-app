'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { subirImagen } from '@/utils/subir-imagen';
import { useLigas } from '@/utils/use-ligas';
import SelectorTemporada from '@/components/selector-temporada';
import LogoEquipo from '@/components/logo-equipo';
import Boton from '@/components/ui/boton';
import Tarjeta from '@/components/ui/tarjeta';
import { TituloSeccion } from '@/components/ui/pagina';
import { Cargando, MensajeError, Vacio } from '@/components/ui/estado';
import { claseCampo, claseCasilla, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseAccionesFila, claseFila, claseLista } from '@/components/ui/lista';
import type { TeamCategory } from '@/lib/team-schema';
import {
    etiquetaCategoria,
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
    const { ligas, seasonId, setSeasonId, elegida } = useLigas();
    const [inscribir, setInscribir] = useState(true);
    const [categoriaElegida, setCategoria] = useState<TeamCategory | ''>('');

    // Solo las categorías de la temporada elegida (valor derivado, igual que
    // en /manejar-temporadas): si la elegida no existe en esta temporada,
    // se usa la primera que sí.
    const categoriasTemporada = elegida?.temporada.categories ?? [];
    const categoria: TeamCategory | '' =
        categoriaElegida && categoriasTemporada.includes(categoriaElegida)
            ? categoriaElegida
            : (categoriasTemporada[0] ?? '');

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
                if (inscribir && seasonId && !categoria) {
                    toast.error('Esa temporada no tiene categorías. Agrégalas en /manejar-temporadas.');
                    return;
                }
                const conInscripcion = inscribir && seasonId && categoria;
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
            {/* Tarjeta de panel con su título: el mismo formato que las
                secciones de los demás paneles de administración. */}
            <Tarjeta variante="panel" as="section">
                <TituloSeccion>{editandoId ? 'Editar equipo' : 'Nuevo equipo'}</TituloSeccion>
                <form onSubmit={onSubmit} className="space-y-5">
                    <div className={claseGrupoCampo}>
                        <label htmlFor="nombre" className={claseEtiqueta}>Nombre</label>
                        <input
                            id="nombre"
                            value={nombre}
                            onChange={(e) => setNombre(e.target.value)}
                            className={`${claseCampo} w-full`}
                            placeholder="Ej. Halcones"
                        />
                    </div>

                    {/* La inscripción solo aplica al CREAR: para inscribir a un
                        equipo existente en otra temporada está /manejar-temporadas. */}
                    {!editandoId && (
                        <fieldset className="space-y-4 rounded-item border border-borde p-4">
                            <label className="flex items-center gap-2.5 text-meta text-tinta-2">
                                <input
                                    type="checkbox"
                                    checked={inscribir}
                                    onChange={(e) => setInscribir(e.target.checked)}
                                    className={claseCasilla}
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
                                    <div className={claseGrupoCampo}>
                                        <label htmlFor="categoria" className={claseEtiqueta}>Categoría</label>
                                        <select
                                            id="categoria"
                                            value={categoria}
                                            onChange={(e) => setCategoria(e.target.value as TeamCategory)}
                                            disabled={categoriasTemporada.length === 0}
                                            className={`${claseCampo} min-w-40`}
                                        >
                                            {categoriasTemporada.length === 0 && (
                                                <option value="">Sin categorías</option>
                                            )}
                                            {categoriasTemporada.map((c) => (
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

                    <div className="flex flex-wrap gap-2">
                        <Boton type="submit" disabled={guardando}>
                            {guardando
                                ? 'Guardando…'
                                : editandoId
                                  ? 'Guardar cambios'
                                  : 'Crear equipo'}
                        </Boton>

                        {editandoId && (
                            <Boton variante="secundario" onClick={limpiarFormulario}>
                                Cancelar
                            </Boton>
                        )}
                    </div>
                </form>
            </Tarjeta>

            {/* ---------- Listado administrable ---------- */}
            <section>
                <TituloSeccion>
                    Equipos registrados{' '}
                    {!cargando && !error && (
                        <span className="font-normal tabular-nums text-tenue">({equipos.length})</span>
                    )}
                </TituloSeccion>

                {cargando && <Cargando texto="Cargando equipos…" />}
                {error && <MensajeError>Error: {error}</MensajeError>}

                {!cargando && !error && equipos.length === 0 && (
                    <Vacio>Todavía no hay equipos. Crea el primero con el formulario de arriba.</Vacio>
                )}

                {!cargando && !error && equipos.length > 0 && (
                    <ul className={claseLista}>
                        {equipos.map((equipo) => (
                            <li key={equipo.id} className={claseFila}>
                                <span className="flex min-w-0 items-center gap-3">
                                    <LogoEquipo nombre={equipo.name} logoUrl={equipo.logoUrl} tamano={40} />

                                    <span className="min-w-0">
                                        <span className="block truncate font-semibold text-tinta">{equipo.name}</span>
                                        <span className="text-meta text-tenue">
                                            {equipo._count.teamSeasons === 0
                                                ? 'Sin inscripciones'
                                                : `${equipo._count.teamSeasons} ${equipo._count.teamSeasons === 1 ? 'inscripción' : 'inscripciones'}`}
                                        </span>
                                    </span>
                                </span>

                                <span className={claseAccionesFila}>
                                    <Boton variante="fantasma" tamano="sm" onClick={() => onEditar(equipo)}>
                                        Editar
                                    </Boton>
                                    {/* Un equipo con historial no se borra (el backend
                                        lo rechaza); ni siquiera se ofrece el botón. */}
                                    {equipo._count.teamSeasons === 0 && (
                                        <Boton
                                            variante="peligro"
                                            tamano="sm"
                                            onClick={() => onEliminar(equipo)}
                                            disabled={guardando}
                                        >
                                            Eliminar
                                        </Boton>
                                    )}
                                </span>
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </div>
    );
}
