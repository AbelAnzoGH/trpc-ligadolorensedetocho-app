import { extendTailwindMerge } from 'tailwind-merge';

/**
 * Une clases de Tailwind y resuelve conflictos: si pasas `px-4` y luego
 * `px-6`, gana la última. Úsalo en vez de `twMerge` directamente.
 *
 * ¿Por qué no basta con twMerge?
 * twMerge no conoce nuestros tamaños de texto con nombre propio. Cuando ve
 * `text-cuerpo` supone que es un COLOR (como `text-tinta`), y al juntarlos
 * borra uno de los dos:
 *
 *     twMerge('text-cuerpo text-tinta')  →  'text-tinta'        ✗ perdió el tamaño
 *     cn('text-cuerpo text-tinta')       →  'text-cuerpo text-tinta'  ✓
 *
 * Por eso aquí se le enseñan los tokens de globals.css.
 * Si agregas un tamaño o un radio nuevo en @theme, agrégalo también aquí.
 */
export const cn = extendTailwindMerge({
    extend: {
        theme: {
            text: [
                'display',
                'titulo-lg',
                'titulo',
                'titulo-sm',
                'subtitulo',
                'cuerpo-lg',
                'cuerpo',
                'meta',
                'leyenda',
                'marca',
            ],
            radius: ['insignia', 'control', 'item', 'panel', 'tarjeta'],
            shadow: ['boton'],
        },
    },
});
