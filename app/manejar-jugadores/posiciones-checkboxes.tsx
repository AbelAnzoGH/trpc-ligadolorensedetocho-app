'use client';

import { playerPositions, type PlayerPosition } from '@/lib/player-schema';
import { etiquetaPosicion } from '@/lib/player-ui';

/**
 * Selector de posiciones múltiples.
 * Se ve como una fila de "chips" pero por debajo son checkboxes de verdad,
 * para que funcione con teclado y con lectores de pantalla.
 */
export default function PosicionesCheckboxes({
    value,
    onChange,
}: {
    value: PlayerPosition[];
    onChange: (posiciones: PlayerPosition[]) => void;
}) {
    const alternar = (posicion: PlayerPosition) => {
        onChange(
            value.includes(posicion)
                ? value.filter((p) => p !== posicion)
                : [...value, posicion],
        );
    };

    return (
        <div className="flex flex-wrap gap-2">
            {playerPositions.map((posicion) => {
                const activa = value.includes(posicion);
                return (
                    <label
                        key={posicion}
                        title={etiquetaPosicion[posicion]}
                        className={`cursor-pointer rounded-full border px-3 py-1 text-sm font-semibold transition ${
                            activa
                                ? 'border-pink-500 bg-pink-500/20 text-pink-300'
                                : 'border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-200'
                        }`}
                    >
                        <input
                            type="checkbox"
                            className="sr-only"
                            checked={activa}
                            onChange={() => alternar(posicion)}
                        />
                        {posicion}
                    </label>
                );
            })}
        </div>
    );
}
