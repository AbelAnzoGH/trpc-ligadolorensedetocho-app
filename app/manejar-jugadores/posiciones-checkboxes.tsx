'use client';

import { claseChip } from '@/components/ui/chip';
import { playerPositions, type PlayerPosition } from '@/lib/player-schema';
import { etiquetaPosicion } from '@/lib/player-ui';

/**
 * Selector de posiciones múltiples.
 * Se ve como una fila de "chips" pero por debajo son checkboxes de verdad,
 * para que funcione con teclado y con lectores de pantalla.
 *
 * Diseño (design.md → Chips seleccionables): claseChip, la misma de las
 * categorías de temporada. Como el checkbox está oculto (sr-only), el anillo
 * de foco se dibuja en la etiqueta (claseChip lo resuelve con has-[:focus-visible]).
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
                    <label key={posicion} title={etiquetaPosicion[posicion]} className={claseChip(activa)}>
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
