'use client';

import { useEffect, useState } from 'react';
import { ACCEPT_IMAGENES, TAMANO_MAXIMO_MB, validarImagen } from '@/lib/imagen';
import { claseAyuda, claseError, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';

/**
 * Selector de imagen con vista previa.
 *
 * El componente no sube nada: solo elige el archivo y lo entrega al padre.
 * La subida ocurre al guardar el formulario, para no dejar archivos huérfanos
 * en el servidor si el usuario se arrepiente a la mitad.
 *
 * Puede mostrar dos cosas distintas en la vista previa:
 *   - `archivo`: algo recién elegido que todavía no se sube
 *   - `urlActual`: el logo que el equipo ya tenía guardado
 */
export default function SelectorImagen({
    archivo,
    urlActual,
    onSeleccionar,
    onQuitar,
    etiqueta = 'Logo',
}: {
    archivo: File | null;
    urlActual: string | null;
    onSeleccionar: (archivo: File | null) => void;
    onQuitar: () => void;
    etiqueta?: string;
}) {
    const [previewLocal, setPreviewLocal] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    // URL.createObjectURL crea una dirección temporal en memoria para ver
    // el archivo antes de subirlo. Hay que liberarla con revokeObjectURL
    // cuando ya no se usa, o el navegador se queda con la copia cargada.
    useEffect(() => {
        if (!archivo) {
            setPreviewLocal(null);
            return;
        }

        const url = URL.createObjectURL(archivo);
        setPreviewLocal(url);

        return () => URL.revokeObjectURL(url);
    }, [archivo]);

    const onCambiarArchivo = (e: React.ChangeEvent<HTMLInputElement>) => {
        const elegido = e.target.files?.[0] ?? null;
        setError(null);

        if (!elegido) {
            onSeleccionar(null);
            return;
        }

        const problema = validarImagen(elegido);
        if (problema) {
            setError(problema);
            e.target.value = ''; // deja el input listo para otro intento
            onSeleccionar(null);
            return;
        }

        onSeleccionar(elegido);
    };

    const preview = previewLocal ?? urlActual;

    return (
        <div className={claseGrupoCampo}>
            <span className={claseEtiqueta}>
                {etiqueta} <span className="font-normal text-tenue">(opcional)</span>
            </span>

            <div className="flex items-center gap-4">
                {/* Borde punteado: es el hueco donde irá la imagen. */}
                <div className="flex size-20 shrink-0 items-center justify-center overflow-hidden rounded-item border border-dashed border-borde-fuerte bg-canvas">
                    {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={preview}
                            alt="Vista previa del logo"
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span className="text-leyenda text-tenue">Sin imagen</span>
                    )}
                </div>

                <div className="flex min-w-0 flex-col gap-2">
                    {/* file: estiliza el botón nativo "Elegir archivo" para que
                        se vea como un <Boton variante="secundario" tamano="sm">. */}
                    <input
                        type="file"
                        accept={ACCEPT_IMAGENES}
                        onChange={onCambiarArchivo}
                        className="block w-full text-meta text-tenue file:mr-3 file:h-8 file:cursor-pointer file:rounded-control file:border file:border-solid file:border-borde-fuerte file:bg-transparent file:px-3 file:text-meta file:font-medium file:text-tinta-2 file:transition-colors hover:file:bg-superficie-2 hover:file:text-tinta"
                    />

                    <p className={claseAyuda}>PNG, JPG o WEBP · máximo {TAMANO_MAXIMO_MB} MB</p>

                    {preview && (
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                onQuitar();
                            }}
                            className="self-start text-leyenda font-medium text-rojo-claro underline-offset-4 hover:underline"
                        >
                            Quitar {etiqueta.toLowerCase()}
                        </button>
                    )}
                </div>
            </div>

            {error && <p className={claseError}>{error}</p>}
        </div>
    );
}
