import sharp from 'sharp';

/** Lado máximo. Ningún logo ni foto de jugador se muestra más grande que esto. */
const LADO_MAXIMO = 800;

/** 82 es el punto dulce de WebP: la diferencia con 100 no se ve, el peso sí. */
const CALIDAD_WEBP = 82;

/**
 * Recibe la imagen que subió el usuario y devuelve otra, mucho más ligera,
 * lista para guardarse. Devuelve un `File` a propósito: así la capa de
 * almacenamiento no se entera de que alguien tocó la imagen en el camino.
 */
export const optimizarImagen = async (archivo: File): Promise<File> => {
    const original = Buffer.from(await archivo.arrayBuffer());

    const optimizado = await sharp(original)
        // Sin argumentos, rotate() aplica la orientación que trae el EXIF.
        // Es la razón por la que las fotos de celular salen acostadas: el
        // sensor guarda los píxeles girados y anota "va rotada 90°" aparte.
        .rotate()
        // fit 'inside' = cabe dentro de 800x800 sin deformarse.
        // withoutEnlargement = si ya era más chica, se deja en paz.
        .resize(LADO_MAXIMO, LADO_MAXIMO, { fit: 'inside', withoutEnlargement: true })
        .webp({ quality: CALIDAD_WEBP })
        .toBuffer();

    return new File([new Uint8Array(optimizado)], 'imagen.webp', { type: 'image/webp' });
};