'use client';

import { teamCategories, type TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';

/**
 * Las categorías de una temporada como botones que se prenden y apagan.
 * Se usa en dos lugares de /manejar-temporadas:
 *   - el formulario de "Crear temporada" (el padre guarda la lista en su estado)
 *   - cada fila de temporada (el padre llama a updateSeason al cambiar)
 *
 * Este componente NO llama al servidor: solo avisa "la lista nueva sería esta"
 * con onCambiar. Así el mismo componente sirve para los dos casos, y la regla
 * de "no quitar una categoría con equipos inscritos" vive donde debe: en el
 * servidor (season-controller.ts).
 */
export default function CategoriasTemporada({
    seleccionadas,
    onCambiar,
    deshabilitado = false,
}: {
    seleccionadas: TeamCategory[];
    onCambiar: (nuevas: TeamCategory[]) => void;
    deshabilitado?: boolean;
}) {
    const alternar = (categoria: TeamCategory) => {
        const nuevas = seleccionadas.includes(categoria)
            ? seleccionadas.filter((c) => c !== categoria)
            : [...seleccionadas, categoria];
        // Se reordena igual que el servidor, para que la lista no "brinque".
        onCambiar(teamCategories.filter((c) => nuevas.includes(c)));
    };

    return (
        <div className="flex flex-wrap gap-2" role="group" aria-label="Categorías de la temporada">
            {teamCategories.map((c) => {
                const activa = seleccionadas.includes(c);
                return (
                    <button
                        key={c}
                        type="button"
                        aria-pressed={activa}
                        disabled={deshabilitado}
                        onClick={() => alternar(c)}
                        className={
                            'rounded-full border px-3 py-1 text-xs transition disabled:opacity-50 ' +
                            (activa
                                ? 'border-pink-500 bg-pink-500/15 text-pink-300'
                                : 'border-gray-700 text-gray-500 hover:text-gray-300')
                        }
                    >
                        {etiquetaCategoria[c]}
                    </button>
                );
            })}
        </div>
    );
}
