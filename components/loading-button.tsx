import React from 'react';
import Spinner from './spinner';
import { claseBoton, type VarianteBoton } from './ui/boton';

type LoadingButtonProps = {
    loading: boolean;
    variante?: VarianteBoton;
    children: React.ReactNode;
    /** @deprecated Diseño viejo. Ya no hace nada: usa `variante`. Bórralo al migrar la página. */
    btnColor?: string;
    /** @deprecated Diseño viejo. Ya no hace nada: el color del texto lo pone `variante`. Bórralo al migrar la página. */
    textColor?: string;
};

/**
 * Botón de envío de formulario que muestra un spinner mientras espera.
 * Por dentro es el mismo botón del sistema (claseBoton), a todo lo ancho.
 */
export const LoadingButton: React.FC<LoadingButtonProps> = ({
    loading = false,
    variante = 'primario',
    children,
}) => {
    return (
        <button
            type="submit"
            // disabled mientras carga: evita que un doble clic mande el
            // formulario dos veces.
            disabled={loading}
            aria-busy={loading}
            className={claseBoton({ variante, tamano: 'lg', anchoCompleto: true })}
        >
            {loading ? (
                <>
                    {/* El botón primario es claro, así que el spinner va oscuro. */}
                    <Spinner color="text-canvas/20" bgColor="fill-canvas" />
                    <span>Cargando…</span>
                </>
            ) : (
                children
            )}
        </button>
    );
};
