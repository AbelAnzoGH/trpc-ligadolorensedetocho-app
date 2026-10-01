'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { cn } from '@/lib/cn';

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
 *
 * Diseño (design.md → Modal): panel con radio de 24px (`rounded-panel`) y
 * borde fino, sin sombra. En móvil sale desde abajo como hoja (solo
 * esquinas de arriba redondeadas); desde `sm` queda centrado.
 */
/**
 * Pila de modales abiertos, del de abajo al de arriba. Hace falta porque un
 * modal puede abrir otro encima (una confirmación dentro del plantel, el
 * plantel dentro de "Ver más"): Escape debe cerrar SOLO el de arriba.
 * Vive fuera del componente porque es una sola para toda la página.
 */
const pilaAbiertos: string[] = [];

type ModalProps = {
    abierto: boolean;
    onCerrar: () => void;
    titulo: string;
    /** Texto pequeño debajo del título (categoría, conteo, etc.). */
    subtitulo?: ReactNode;
    /**
     * 'normal' (max-w-lg) para listas y formularios; 'amplio' (max-w-3xl)
     * para contenido ancho, como una tabla de posiciones completa.
     */
    ancho?: 'normal' | 'amplio';
    children: ReactNode;
};

export default function Modal({ abierto, onCerrar, titulo, subtitulo, ancho = 'normal', children }: ModalProps) {
    // `createPortal` necesita `document`, que no existe mientras Next renderiza
    // en el servidor. Este estado se vuelve true solo después del primer
    // render en el navegador, así el HTML del servidor y el del cliente
    // coinciden y React no marca error de hidratación.
    const [montado, setMontado] = useState(false);
    useEffect(() => setMontado(true), []);

    // Al abrirse, este modal se pone arriba de la pila; al cerrarse, sale.
    // Efecto aparte del de Escape a propósito: aquel se vuelve a correr cada
    // vez que cambia onCerrar (casi en cada render), y si la pila se tocara
    // ahí, un modal de abajo que se redibuja se "subiría" encima del otro.
    const id = useId();
    useEffect(() => {
        if (!abierto) return;
        pilaAbiertos.push(id);
        return () => {
            const i = pilaAbiertos.lastIndexOf(id);
            if (i !== -1) pilaAbiertos.splice(i, 1);
        };
    }, [abierto, id]);

    // Escape para cerrar, solo si este es el modal de ARRIBA. El listener se
    // pone solo cuando el modal está abierto y se quita al cerrarse (o al
    // desmontar el componente): eso es lo que hace el `return` del useEffect.
    useEffect(() => {
        if (!abierto) return;

        const alPresionar = (evento: KeyboardEvent) => {
            if (evento.key === 'Escape' && pilaAbiertos[pilaAbiertos.length - 1] === id) onCerrar();
        };

        window.addEventListener('keydown', alPresionar);
        return () => window.removeEventListener('keydown', alPresionar);
    }, [abierto, onCerrar, id]);

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
        // el clic para cerrar. bg-canvas/80 en vez de negro puro: el sistema
        // no usa #000.
        <div
            className="fixed inset-0 z-50 flex items-end justify-center bg-canvas/80 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={onCerrar}
        >
            <div
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                // stopPropagation: sin esto, cualquier clic DENTRO del panel
                // subiría hasta el fondo y cerraría el modal sin querer.
                onClick={(evento) => evento.stopPropagation()}
                className={cn(
                    'flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-panel border border-borde bg-superficie sm:rounded-panel',
                    ancho === 'amplio' ? 'max-w-3xl' : 'max-w-lg',
                )}
            >
                {/* ---------- Encabezado fijo ---------- */}
                <div className="flex items-start justify-between gap-4 border-b border-borde px-6 py-5">
                    <div className="min-w-0">
                        <h2 className="truncate text-subtitulo font-semibold text-tinta">{titulo}</h2>
                        {subtitulo && (
                            <p className="truncate text-meta text-tenue">{subtitulo}</p>
                        )}
                    </div>

                    <button
                        type="button"
                        onClick={onCerrar}
                        aria-label="Cerrar"
                        className="flex size-9 shrink-0 items-center justify-center rounded-control text-tenue transition-colors hover:bg-superficie-2 hover:text-tinta"
                    >
                        <svg aria-hidden viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" className="size-5">
                            <path d="M6 6l12 12M18 6L6 18" />
                        </svg>
                    </button>
                </div>

                {/* ---------- Cuerpo con scroll propio ---------- */}
                {/* El scroll vive aquí y no en el panel completo, para que el
                    encabezado con el nombre del equipo se quede siempre visible. */}
                <div className="flex-1 overflow-y-auto px-6 py-5">{children}</div>
            </div>
        </div>,
        document.body,
    );
}
