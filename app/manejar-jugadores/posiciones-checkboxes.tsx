'use client';

import { cn } from '@/lib/cn';
import { playerPositions, type PlayerPosition } from '@/lib/player-schema';
import { etiquetaPosicion } from '@/lib/player-ui';

/**
 * Selector de posiciones múltiples.
 * Se ve como una fila de "chips" pero por debajo son checkboxes de verdad,
 * para que funcione con teclado y con lectores de pantalla.
 *
 * Diseño (design.md → Chips seleccionables): apagado = contorno gris;
 * elegido = verde claro (el mismo verde de la casilla y del foco: "activo").
 * Como el checkbox está oculto (sr-only), el anillo de foco se dibuja en la
 * etiqueta con `has-[:focus-visible]`: si el checkbox de adentro tiene el
 * foco del teclado, la etiqueta se marca.
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
                        className={cn(
                            'cursor-pointer select-none rounded-insignia border px-3 py-1 text-meta font-semibold transition-colors',
                            'has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-foco',
                            activa
                                ? 'border-verde-claro/50 bg-verde-claro/15 text-verde-claro'
                                : 'border-borde-fuerte text-tenue hover:border-tenue hover:text-tinta',
                        )}
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
