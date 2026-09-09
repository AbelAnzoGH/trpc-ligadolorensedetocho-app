'use client';

import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';

/**
 * Ventana emergente genérica del sitio.
 *
 * Es "tonta" a propósito: no sabe qué se muestra adentro ni de dónde salen
 * los datos. Solo se encarga de las cuatro cosas que TODO modal necesita y
 * que es fácil olvidar:
 *
 *   1. Pintarse encima de todo, sin que un `overflow-hidden` de la tabla lo
 *      recorte  → por eso usa un portal a <body>.
 *   2. Cerrarse con la tecla Escape.
 *   3. Cerrarse al hacer clic en el fondo oscuro (pero NO al hacer clic
 *      dentro del panel).
 *   4. Impedir que la página de atrás siga haciendo scroll mientras está
 *      abierto.
 *
 * Quien lo use solo le pasa `abierto`, `onCerrar`, un `titulo` y los hijos.
 */
type ModalProps = {
    abierto: boolean;
    onCerrar: () => void;
    titulo: string;
    /** Texto pequeño debajo del título (categoría, conteo, etc.). */
    subtitulo?: ReactNode;
    children: ReactNode;
};

export default function Modal({ abierto, onCerrar, titulo, subtitulo, children }: ModalProps) {
    // `createPortal` necesita `document`, que no existe mientras Next renderiza
    // en el servidor. Este estado se vuelve true solo después del primer
    // render en el navegador, así el HTML del servidor y el del cliente
    // coinciden y React no marca error de hidratación.
    const [montado, setMontado] = useState(false);
    useEffect(() => setMontado(true), []);

    // Escape para cerrar. El listener se pone solo cuando el modal está
    // abierto y se quita al cerrarse (o al desmontar el componente): eso es
    // lo que hace el `return` de dentro del useEffect.
    useEffect(() => {
        if (!abierto) return;

        const alPresionar = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape') onCerrar();
        };

        window.addEventListener('keydown', alPresionar);
        return () => window.removeEventListener('keydown', alPresionar);
    }, [abierto, onCerrar]);

    // Congela el scroll del fondo mientras el modal está abierto y lo
    // devuelve exactamente como estaba al cerrar.
    useEffect(() => {
        if (!abierto) return;

        const anterior = document.body.style.overflow;
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = anterior;
        };
    }, [abierto]);

    if (!abierto || !montado) return null;

    return createPortal(
        // El contenedor exterior ES el fondo oscuro y también el que escucha
        // el clic para cerrar.
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onCerrar}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                // stopPropagation: sin esto, cualquier clic DENTRO del panel
                // subiría hasta el fondo y cerraría el modal sin querer.
                onClick={(evento) => evento.stopPropagation()}
                className="flex max-h-[85vh] w-full max-w-lg flex-col overflow-hidden rounded-t-2xl border border-gray-800 bg-gray-950 shadow-2xl sm:rounded-2xl"
            >
                {/* ---------- Encabezado fijo ---------- */}
                <div className="flex items-start justify-between gap-4 border-b border-gray-800 px-5 py-4">
                    <div className="min-w-0">
                        <h2 className="truncate text-lg font-bold text-white">{titulo}</h2>
                        {subtitulo && (
                            <p className="truncate text-sm text-gray-400">{subtitulo}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar"
                        className="shrink-0 rounded-md p-1 text-2xl leading-none text-gray-500 transition hover:bg-gray-900 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
                    >
                        &times;
                    </button>
                </div>

                {/* ---------- Cuerpo con scroll propio ---------- */}
                {/* El scroll vive aquí y no en el panel completo, para que el
                    encabezado con el nombre del equipo se quede siempre visible. */}
                <div className="flex-1 overflow-y-auto px-5 py-4">{children}</div>
            </div>
        </div>,
        document.body,
    );
}
