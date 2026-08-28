/**
 * Sube un archivo a /api/upload y devuelve dónde quedó guardado.
 *
 * Fíjate en lo que NO hay aquí: no se pone el header 'Content-Type'.
 * Con FormData hay que dejar que el navegador lo ponga solo, porque
 * multipart necesita un "boundary" aleatorio en el header que solo él
 * conoce. Ponerlo a mano rompe la petición.
 */
export type ImagenSubida = { url: string; key: string };

/**
 * `carpeta` le dice al servidor qué se está subiendo. El servidor NO le cree
 * ciegamente: valida contra su propia lista de carpetas permitidas.
 */
export type CarpetaSubida = 'logos' | 'jugadores';

export const subirImagen = async (
    archivo: File,
    carpeta: CarpetaSubida = 'logos',
): Promise<ImagenSubida> => {
    const formData = new FormData();
    formData.append('file', archivo);
    formData.append('carpeta', carpeta);

    const res = await fetch('/api/upload', {
        method: 'POST',
        credentials: 'include', // el endpoint exige sesión
        body: formData,
    });

    const json = await res.json().catch(() => null);

    if (!res.ok) {
        throw new Error(json?.error ?? `No se pudo subir la imagen (${res.status})`);
    }

    return json as ImagenSubida;
};
