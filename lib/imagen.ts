/**
 * Reglas de las imágenes, en un archivo SIN dependencias de Node.
 *
 * Esto importa: `lib/server/storage.ts` usa `node:fs`, que no existe en el
 * navegador. Si el formulario importara las constantes de allá, Next.js
 * intentaría meter el sistema de archivos en el bundle del cliente y
 * reventaría. Al vivir aquí, las MISMAS reglas las pueden leer los dos
 * lados: el formulario para avisar rápido, y el servidor para decidir.
 */

/** 2 MB. Un logo de equipo no tiene por qué pesar más. */
export const TAMANO_MAXIMO_BYTES = 2 * 1024 * 1024;

/**
 * Formatos aceptados, y la extensión con la que se guarda cada uno.
 *
 * SVG queda FUERA a propósito: un .svg es texto que puede llevar <script>
 * adentro, y servirlo desde nuestro propio dominio abriría la puerta a
 * ejecutar código en el navegador de los visitantes.
 */
export const TIPOS_PERMITIDOS: Record<string, string> = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/webp': 'webp',
};

/** Para el atributo accept del <input type="file">. */
export const ACCEPT_IMAGENES = Object.keys(TIPOS_PERMITIDOS).join(',');

export const TAMANO_MAXIMO_MB = TAMANO_MAXIMO_BYTES / 1024 / 1024;

/**
 * Validación que corre en el NAVEGADOR, solo para dar respuesta inmediata.
 * No sustituye a la del servidor: cualquiera puede saltarse el formulario.
 */
export const validarImagen = (archivo: File): string | null => {
    if (!TIPOS_PERMITIDOS[archivo.type]) {
        return `Formato no permitido. Se aceptan: ${Object.keys(TIPOS_PERMITIDOS)
            .map((t) => t.replace('image/', '.'))
            .join(', ')}`;
    }

    if (archivo.size > TAMANO_MAXIMO_BYTES) {
        return `La imagen no puede pesar más de ${TAMANO_MAXIMO_MB} MB`;
    }

    return null;
};
