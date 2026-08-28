'use client';

import { useEffect, useState } from 'react';
import { ACCEPT_IMAGENES, TAMANO_MAXIMO_MB, validarImagen } from '@/lib/imagen';

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
        <div className="flex flex-col gap-2">
            <span className="text-sm text-gray-300">
                {etiqueta}{' '}
                <span className="text-gray-500">(opcional)</span>
            </span>

            <div className="flex items-center gap-4">
                <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-dashed border-gray-700 bg-gray-950/60">
                    {preview ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                            src={preview}
                            alt="Vista previa del logo"
                            className="h-full w-full object-contain"
                        />
                    ) : (
                        <span className="text-[10px] uppercase tracking-widest text-gray-600">
                            Sin logo
                        </span>
                    )}
                </div>

                <div className="flex flex-col gap-2">
                    <input
                        type="file"
                        accept={ACCEPT_IMAGENES}
                        onChange={onCambiarArchivo}
                        className="block w-full text-sm text-gray-400 file:mr-3 file:cursor-pointer file:rounded-full file:border-0 file:bg-gray-800 file:px-4 file:py-1.5 file:text-sm file:font-semibold file:text-gray-200 hover:file:bg-gray-700"
                    />

                    <p className="text-xs text-gray-500">
                        PNG, JPG o WEBP · máximo {TAMANO_MAXIMO_MB} MB
                    </p>

                    {preview && (
                        <button
                            type="button"
                            onClick={() => {
                                setError(null);
                                onQuitar();
                            }}
                            className="self-start text-xs font-semibold text-red-400 hover:text-red-300"
                        >
                            Quitar logo
                        </button>
                    )}
                </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
        </div>
    );
}
