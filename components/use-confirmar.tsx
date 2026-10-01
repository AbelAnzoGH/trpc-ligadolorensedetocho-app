'use client';

import { useCallback, useRef, useState, type ReactNode } from 'react';
import Modal from '@/components/modal';
import Boton from '@/components/ui/boton';

/**
 * Confirmación antes de una acción destructiva ("¿Estás seguro de que
 * quieres eliminar este equipo?").
 *
 * Es un HOOK y no un componente con estado afuera, para que agregar la
 * confirmación a un botón que ya existe sea una sola línea:
 *
 *   const { confirmar, modalConfirmar } = useConfirmar();
 *
 *   const onEliminar = async () => {
 *       const ok = await confirmar({
 *           titulo: 'Eliminar equipo',
 *           mensaje: <>¿Estás seguro de que quieres eliminar <strong>Halcones</strong>?</>,
 *       });
 *       if (!ok) return;
 *       // … lo de siempre
 *   };
 *
 *   return <>…{modalConfirmar}</>;
 *
 * `confirmar` devuelve una promesa que se resuelve en true (confirmó) o false
 * (canceló, Escape o clic afuera). Por dentro guarda la función `resolver`
 * de esa promesa y la llama cuando el usuario elige.
 *
 * Diseño (design.md → Confirmación): el modal de siempre, el mensaje en
 * `tinta-2`, una línea de aviso en `tenue` y dos botones a la derecha:
 * "Cancelar" (secundario, con el foco) y la acción (peligro). El foco
 * empieza en Cancelar para que un Enter distraído no borre nada.
 */

type Pedido = {
    /** Corto: va en el encabezado del modal, que corta lo que no cabe. */
    titulo: string;
    /** La pregunta, con el nombre de lo que se va a borrar. */
    mensaje: ReactNode;
    /** Texto del botón peligroso. Por defecto "Eliminar". */
    textoConfirmar?: string;
    /** Línea de abajo. Por defecto "Esta acción no se puede deshacer." */
    aviso?: ReactNode;
};

export function useConfirmar() {
    const [pedido, setPedido] = useState<Pedido | null>(null);
    // La función que resuelve la promesa pendiente. En un ref (y no en el
    // estado) porque no se pinta: solo se llama una vez.
    const resolver = useRef<((ok: boolean) => void) | null>(null);

    const confirmar = useCallback(
        (p: Pedido) =>
            new Promise<boolean>((resolve) => {
                // Si había otra confirmación abierta (no debería), se cancela.
                resolver.current?.(false);
                resolver.current = resolve;
                setPedido(p);
            }),
        [],
    );

    const responder = useCallback((ok: boolean) => {
        resolver.current?.(ok);
        resolver.current = null;
        setPedido(null);
    }, []);

    const modalConfirmar = (
        <Modal abierto={pedido !== null} onCerrar={() => responder(false)} titulo={pedido?.titulo ?? ''}>
            <div className="space-y-2">
                <p className="text-cuerpo text-tinta-2">{pedido?.mensaje}</p>
                <p className="text-meta text-tenue">{pedido?.aviso ?? 'Esta acción no se puede deshacer.'}</p>
            </div>
            <div className="mt-6 flex flex-wrap justify-end gap-2">
                {/* autoFocus en Cancelar: Enter por reflejo no destruye nada. */}
                <Boton variante="secundario" onClick={() => responder(false)} autoFocus>
                    Cancelar
                </Boton>
                <Boton variante="peligro" onClick={() => responder(true)}>
                    {pedido?.textoConfirmar ?? 'Eliminar'}
                </Boton>
            </div>
        </Modal>
    );

    return { confirmar, modalConfirmar };
}
