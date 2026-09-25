'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import Boton from '@/components/ui/boton';
import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { claseFila, claseLista } from '@/components/ui/lista';
import type { Venue } from '@/lib/game-ui';

/**
 * Las sedes: se registran una vez y los partidos apuntan a ellas.
 * Este componente solo pinta y avisa; las llamadas al servidor las hace
 * el panel (onCrear / onEliminar), igual que en el resto de /manejar-*.
 */
export default function SedesSeccion({
    sedes,
    guardando,
    onCrear,
    onEliminar,
}: {
    sedes: Venue[];
    guardando: boolean;
    /** Devuelve true si se creó, para limpiar el formulario. */
    onCrear: (datos: { name: string; address: string | null }) => Promise<boolean>;
    onEliminar: (sede: Venue) => void;
}) {
    const [nombre, setNombre] = useState('');
    const [direccion, setDireccion] = useState('');

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) {
            toast.error('El nombre de la sede es requerido');
            return;
        }
        const ok = await onCrear({ name: nombre.trim(), address: direccion.trim() || null });
        if (ok) {
            setNombre('');
            setDireccion('');
        }
    };

    return (
        <div className="space-y-5">
            {sedes.length > 0 && (
                <ul className={claseLista}>
                    {sedes.map((s) => (
                        <li key={s.id} className={claseFila}>
                            <span className="min-w-0">
                                <span className="block font-semibold text-tinta">{s.name}</span>
                                {s.address && <span className="block text-meta text-tenue">{s.address}</span>}
                                <span className="block text-leyenda text-tenue">
                                    {s._count.games} {s._count.games === 1 ? 'partido' : 'partidos'}
                                </span>
                            </span>
                            {/* Solo una sede sin partidos se puede borrar. */}
                            {s._count.games === 0 && (
                                <Boton variante="peligro" tamano="sm" disabled={guardando} onClick={() => onEliminar(s)}>
                                    Eliminar
                                </Boton>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
                <div className={`${claseGrupoCampo} min-w-56 flex-1`}>
                    <label htmlFor="sede-nombre" className={claseEtiqueta}>Nombre</label>
                    <input
                        id="sede-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className={`${claseCampo} w-full`}
                        placeholder="Ej. Unidad Deportiva Miguel Hidalgo y Costilla"
                    />
                </div>
                <div className={`${claseGrupoCampo} min-w-56 flex-1`}>
                    <label htmlFor="sede-direccion" className={claseEtiqueta}>
                        Dirección <span className="font-normal text-tenue">(opcional)</span>
                    </label>
                    <input
                        id="sede-direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className={`${claseCampo} w-full`}
                    />
                </div>
                <Boton type="submit" disabled={guardando}>
                    Agregar sede
                </Boton>
            </form>
        </div>
    );
}
