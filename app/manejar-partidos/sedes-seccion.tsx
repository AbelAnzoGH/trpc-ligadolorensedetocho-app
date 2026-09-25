'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import { inputClass } from '@/lib/team-ui';
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
        <div className="space-y-4">
            {sedes.length > 0 && (
                <ul className="divide-y divide-gray-800 overflow-hidden rounded-lg border border-gray-800">
                    {sedes.map((s) => (
                        <li key={s.id} className="flex flex-wrap items-center justify-between gap-3 bg-gray-950/40 px-4 py-3">
                            <span>
                                <strong className="text-white">{s.name}</strong>
                                {s.address && <span className="block text-sm text-gray-400">{s.address}</span>}
                                <span className="block text-xs text-gray-500">
                                    {s._count.games} {s._count.games === 1 ? 'partido' : 'partidos'}
                                </span>
                            </span>
                            {/* Solo una sede sin partidos se puede borrar. */}
                            {s._count.games === 0 && (
                                <button
                                    type="button"
                                    disabled={guardando}
                                    onClick={() => onEliminar(s)}
                                    className="rounded-full border border-red-500/60 px-3 py-1 text-sm text-red-400 hover:text-red-300 disabled:opacity-50"
                                >
                                    Eliminar
                                </button>
                            )}
                        </li>
                    ))}
                </ul>
            )}

            <form onSubmit={onSubmit} className="flex flex-wrap items-end gap-3">
                <div className="flex min-w-56 flex-1 flex-col gap-1">
                    <label htmlFor="sede-nombre" className="text-sm text-gray-300">Nombre</label>
                    <input
                        id="sede-nombre"
                        value={nombre}
                        onChange={(e) => setNombre(e.target.value)}
                        className={inputClass}
                        placeholder="Ej. Unidad Deportiva Miguel Hidalgo y Costilla"
                    />
                </div>
                <div className="flex min-w-56 flex-1 flex-col gap-1">
                    <label htmlFor="sede-direccion" className="text-sm text-gray-300">Dirección (opcional)</label>
                    <input
                        id="sede-direccion"
                        value={direccion}
                        onChange={(e) => setDireccion(e.target.value)}
                        className={inputClass}
                    />
                </div>
                <button
                    type="submit"
                    disabled={guardando}
                    className="rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-5 py-2 font-semibold text-white transition duration-300 hover:bg-linear-to-l disabled:opacity-50"
                >
                    Agregar sede
                </button>
            </form>
        </div>
    );
}
