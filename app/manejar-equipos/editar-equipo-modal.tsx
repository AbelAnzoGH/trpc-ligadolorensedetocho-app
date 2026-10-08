'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Modal from '@/components/modal';
import Boton from '@/components/ui/boton';
import SelectorImagen from '@/components/selector-imagen';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { trpcMutation } from '@/utils/trpc-fetch';
import { subirImagen } from '@/utils/subir-imagen';
import type { Team, TeamResponse } from '@/lib/team-ui';
import InscripcionesEquipo from './inscripciones-equipo';

/**
 * Edición de UN equipo (nombre, logo e inscripciones) en una ventana
 * emergente. Antes se editaba en el formulario de hasta arriba de la página;
 * con muchos equipos obligaba a subir y bajar, por eso ahora se abre encima
 * de la lista, justo donde se hizo clic.
 *
 * El padre lo monta solo cuando está abierto (`{editando && <EditarEquipoModal …/>}`),
 * así cada apertura arranca con el estado limpio y no hay que "resetear" nada
 * al cambiar de equipo. Mismo patrón que PlantelModal.
 *
 * Crear equipos sigue en el formulario de la página: ahí vive la inscripción
 * opcional, que no aplica al editar.
 */
export default function EditarEquipoModal({
    equipo,
    onCerrar,
    onCambio,
}: {
    equipo: Team;
    onCerrar: () => void;
    /** Se llama tras guardar o corregir una inscripción, para que la lista de atrás se actualice. */
    onCambio: () => Promise<void>;
}) {
    const [nombre, setNombre] = useState(equipo.name);
    // archivoLogo : lo que el usuario acaba de elegir y aún NO se ha subido
    // logoActual  : lo que se está mostrando en la vista previa
    // El logo ORIGINAL es `equipo.logoUrl`; se compara al guardar para saber
    // si el usuario lo quitó (había uno, ahora no hay, y tampoco eligió otro).
    const [archivoLogo, setArchivoLogo] = useState<File | null>(null);
    const [logoActual, setLogoActual] = useState<string | null>(equipo.logoUrl);
    const [guardando, setGuardando] = useState(false);

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            toast.error('El nombre del equipo es requerido');
            return;
        }

        setGuardando(true);
        try {
            // Primero se sube el archivo nuevo, antes de tocar la base: si la
            // subida falla, el equipo se queda como estaba.
            let logo: { logoUrl?: string | null; logoKey?: string | null } = {};
            if (archivoLogo) {
                const subida = await subirImagen(archivoLogo);
                logo = { logoUrl: subida.url, logoKey: subida.key };
            } else if (equipo.logoUrl && !logoActual) {
                // Había logo, lo quitó y no eligió otro: null explícito para que el backend lo borre.
                logo = { logoUrl: null, logoKey: null };
            }
            // Si no entra en ningún caso, `logo` queda vacío y el backend no toca el logo.

            await trpcMutation<TeamResponse>('updateTeam', { id: equipo.id, name: nombre.trim(), ...logo });
            toast.success('Equipo actualizado');
            await onCambio();
            onCerrar();
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal abierto onCerrar={onCerrar} titulo="Editar equipo" subtitulo={equipo.name}>
            <form onSubmit={onSubmit} className="space-y-5">
                <div className={claseGrupoCampo}>
                    <label htmlFor="editar-nombre" className={claseEtiqueta}>Nombre</label>
                    <input
                        id="editar-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className={`${claseCampo} w-full`}
                        placeholder="Ej. Halcones"
                    />
                </div>

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
                        {guardando ? 'Guardando…' : 'Guardar cambios'}
                    </Boton>
                    <Boton variante="secundario" onClick={onCerrar} disabled={guardando}>
                        Cancelar
                    </Boton>
                </div>
            </form>

            {/* Fuera del <form>: cada inscripción tiene sus propios botones
                y no debe enviar el formulario del equipo. */}
            <InscripcionesEquipo teamId={equipo.id} onCambio={onCambio} />
        </Modal>
    );
}
