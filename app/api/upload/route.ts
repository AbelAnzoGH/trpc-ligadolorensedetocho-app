import { optimizarImagen } from '@/lib/server/optimizar-imagen';
import { NextResponse } from 'next/server';
import { createContext } from '@/utils/trpc-context';
import {
    almacenamiento,
    CARPETA_LOGOS,
    esCarpetaValida,
    TAMANO_MAXIMO_BYTES,
    TIPOS_PERMITIDOS,
} from '@/lib/server/storage';

/**
 * ENDPOINT DE SUBIDA DE IMÁGENES
 *
 * ¿Por qué esto NO es un procedimiento de tRPC?
 *
 * tRPC manda todo como JSON (y encima pasado por SuperJSON). Un archivo
 * binario no cabe ahí: habría que convertirlo a texto base64, lo que lo
 * infla ~33% y obliga al servidor a cargarlo entero en memoria.
 *
 * La forma nativa de la web para mandar archivos es `multipart/form-data`,
 * y Next.js la soporta directo en un "Route Handler" como este. Así que la
 * división queda:
 *
 *   este endpoint  → recibe el ARCHIVO y devuelve una URL
 *   tRPC           → recibe la URL (texto) y la guarda en la base de datos
 *
 * Son dos peticiones, y eso es a propósito: es exactamente el mismo flujo
 * que usan S3 y Cloudinary, así que migrar no cambiará la forma del código.
 */
export async function POST(request: Request) {
    // 1) ¿Quién eres? Mismo mecanismo que protectedProcedure, pero a mano:
    //    este archivo no pasa por el router de tRPC, así que la verificación
    //    de sesión NO viene incluida. Olvidarla dejaría a cualquiera subir
    //    archivos a tu servidor.
    const ctx = await createContext();

    if (!ctx.user) {
        return NextResponse.json(
            { error: 'Debes iniciar sesión para subir imágenes' },
            { status: 401 },
        );
    }

    try {
        // 2) Leer el archivo del formulario multipart
        const formData = await request.formData();
        const archivo = formData.get('file');

        if (!(archivo instanceof File)) {
            return NextResponse.json(
                { error: 'No se recibió ningún archivo' },
                { status: 400 },
            );
        }

        // 3) Validar TIPO. El navegador ya filtra con el accept del input,
        //    pero eso es solo una comodidad visual: cualquiera puede mandar
        //    una petición sin pasar por el formulario. La validación de
        //    verdad siempre va en el servidor.
        if (!TIPOS_PERMITIDOS[archivo.type]) {
            return NextResponse.json(
                {
                    error: `Formato no permitido. Se aceptan: ${Object.keys(TIPOS_PERMITIDOS).join(', ')}`,
                },
                { status: 400 },
            );
        }

        // 4) Validar TAMAÑO, por la misma razón.
        if (archivo.size > TAMANO_MAXIMO_BYTES) {
            const maximoMb = TAMANO_MAXIMO_BYTES / 1024 / 1024;
            return NextResponse.json(
                { error: `La imagen no puede pesar más de ${maximoMb} MB` },
                { status: 400 },
            );
        }

        // 5) Elegir la carpeta. El formulario manda un campo extra diciendo
        //    qué está subiendo ("logos" o "jugadores"). Si viene cualquier
        //    otra cosa —o no viene— se usa la de logos en vez de confiar en
        //    el texto recibido: nunca se construye una ruta con datos crudos
        //    del cliente.
        const carpetaPedida = formData.get('carpeta');
        const carpeta = esCarpetaValida(carpetaPedida) ? carpetaPedida : CARPETA_LOGOS;

        // 6) Comprimir y redimensionar antes de guardar. Un logo de 2 MB que
        //    sale del celular termina pesando ~60 KB, y es la medida que más
        //    rinde: menos ancho de banda, carga más rápida y menos consumo del
        //    plan gratis del bucket.
        const optimizada = await optimizarImagen(archivo);

        // 7) Guardar. Único paso que cambia según el entorno.
        const guardado = await almacenamiento.guardar(optimizada, carpeta);

        // 8) Devolver la url y la key para que el formulario las mande a tRPC.
        return NextResponse.json(guardado, { status: 201 });
    } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error al subir la imagen';
        return NextResponse.json({ error: message }, { status: 500 });
    }
}
