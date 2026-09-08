import {put, del} from '@vercel/blob';
import { randomUUID } from 'node:crypto';
import { mkdir, writeFile, unlink } from 'node:fs/promises';
import path from 'node:path';

// Las reglas (tamaño y formatos) viven en lib/imagen.ts porque también
// las necesita el formulario, y ese archivo no puede importar node:fs.
import { TIPOS_PERMITIDOS } from '@/lib/imagen';
export { TAMANO_MAXIMO_BYTES, TIPOS_PERMITIDOS } from '@/lib/imagen';

/**
 * CAPA DE ALMACENAMIENTO DE ARCHIVOS
 *
 * La idea central: el resto del proyecto NO sabe dónde se guardan las
 * imágenes. Solo conoce estas dos funciones. Hoy escriben en el disco de
 * tu computadora; mañana pueden hablarle a S3, Cloudinary o UploadThing,
 * y ningún otro archivo del proyecto cambia.
 *
 * A eso se le llama "patrón adaptador": defines UNA forma de pedir las
 * cosas (la interfaz `Almacenamiento`) y varias formas de cumplirla.
 */

/** Lo que devuelve cualquier almacenamiento al guardar un archivo. */
export type ArchivoGuardado = {
    /** Dirección pública para mostrarlo en un <img src="..."> */
    url: string;
    /** Identificador interno, el que hace falta para borrarlo después */
    key: string;
};

export interface Almacenamiento {
    guardar(archivo: File, carpeta: string): Promise<ArchivoGuardado>;
    borrar(key: string): Promise<void>;
}

// ---------------------------------------------------------------------------
// Implementación LOCAL: escribe dentro de public/uploads
// ---------------------------------------------------------------------------

// Next.js sirve todo lo que esté en /public tal cual, sin configurar nada:
// un archivo en public/uploads/logos/x.png queda disponible en
// http://localhost:3000/uploads/logos/x.png
const RAIZ_PUBLICA = path.join(process.cwd(), 'public');
const CARPETA_BASE = 'uploads';

const almacenamientoLocal: Almacenamiento = {
    async guardar(archivo, carpeta) {
        const extension = TIPOS_PERMITIDOS[archivo.type];
        if (!extension) {
            throw new Error(`Tipo de archivo no permitido: ${archivo.type}`);
        }

        // Nombre aleatorio, NUNCA el que traía el archivo del usuario.
        // Un nombre como "../../.env" o "logo.php" podría hacer estragos;
        // además así dos personas pueden subir "logo.png" sin pisarse.
        const nombre = `${randomUUID()}.${extension}`;
        const key = `${carpeta}/${nombre}`;

        const destino = path.join(RAIZ_PUBLICA, CARPETA_BASE, carpeta);
        await mkdir(destino, { recursive: true });

        // El File del navegador llega como stream; hay que pasarlo a Buffer
        // para poder escribirlo en disco con Node.
        const bytes = Buffer.from(await archivo.arrayBuffer());
        await writeFile(path.join(destino, nombre), bytes);

        return {
            url: `/${CARPETA_BASE}/${key}`,
            key,
        };
    },

    async borrar(key) {
        // Cinturón de seguridad: si la key trae ".." alguien está intentando
        // salirse de la carpeta de subidas para borrar otra cosa.
        if (key.includes('..')) {
            throw new Error('Key inválida');
        }

        try {
            await unlink(path.join(RAIZ_PUBLICA, CARPETA_BASE, key));
        } catch {
            // Si el archivo ya no existe, no es un problema: el objetivo
            // (que no esté) ya se cumplió. Fallar aquí impediría borrar un
            // equipo solo porque alguien borró su logo a mano.
        }
    },
};

// ---------------------------------------------------------------------------
// Implementación REMOTA: escribe en Vercel Blob
// ---------------------------------------------------------------------------

const almacenamientoRemoto: Almacenamiento = {
    async guardar(archivo, carpeta) {
        const extension = TIPOS_PERMITIDOS[archivo.type];
        if (!extension) {
            throw new Error(`Tipo de archivo no permitido: ${archivo.type}`);
        }

        const nombre = `${randomUUID()}.${extension}`;

        const blob = await put(`${carpeta}/${nombre}`, archivo, {
            access: 'public',
            contentType: archivo.type,
            // Nosotros ya ponemos un UUID; no queremos que Vercel le
            // agregue otro sufijo aleatorio encima.
            addRandomSuffix: false,
        });

        // Aquí la `key` es la URL completa, no una ruta relativa como en
        // el almacenamiento local: es lo que `del()` necesita recibir.
        // Que cada implementación defina su propia `key` es justamente
        // para lo que sirve la interfaz — nadie más la interpreta.
        return { url: blob.url, key: blob.url };
    },

    async borrar(key) {
        await del(key);
    },
};
//export const almacenamiento: Almacenamiento = almacenamientoLocal;

/**
 * El almacenamiento que usa la aplicación.
 *
 * La decisión la toma el entorno, no el código: si existe el token del
 * bucket (lo inyecta Vercel), se escribe allá. En tu máquina no existe,
 * así que sigues escribiendo en public/uploads como hasta ahora.
 */
export const almacenamiento: Almacenamiento = process.env.BLOB_READ_WRITE_TOKEN
    ? almacenamientoRemoto
    : almacenamientoLocal;

/**
 * Las carpetas donde se puede subir algo.
 *
 * Es una lista cerrada a propósito. La carpeta llega desde el navegador
 * (el formulario dice si sube un logo o una foto), y si se aceptara
 * cualquier texto alguien podría mandar "../../app" y escribir archivos
 * dentro del código del proyecto. Al validar contra esta lista, cualquier
 * valor que no esté aquí se rechaza antes de tocar el disco.
 */
export const CARPETAS = {
    logos: 'logos',        // logos de equipos
    jugadores: 'jugadores', // fotos de jugadores
} as const;

export type CarpetaSubida = keyof typeof CARPETAS;

export const esCarpetaValida = (valor: unknown): valor is CarpetaSubida =>
    typeof valor === 'string' && valor in CARPETAS;

/** Carpeta donde viven los logos de equipos. */
export const CARPETA_LOGOS = CARPETAS.logos;

/** Carpeta donde viven las fotos de jugadores. */
export const CARPETA_JUGADORES = CARPETAS.jugadores;
