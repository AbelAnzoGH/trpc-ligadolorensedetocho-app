'use client';

import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import queryClient from '@/utils/query-client';
import { trpc } from '@/utils/trpc';
import Boton from './ui/boton';

/**
 * Cierra la sesión. Antes esto vivía en auth-menu.tsx junto con los enlaces
 * de admin; se separó porque son dos cosas distintas: uno es navegación
 * (depende del rol) y el otro es una acción (depende de que haya sesión).
 *
 * Es un <button> y no un <li onClick>: un <li> no se puede enfocar con Tab
 * ni activar con Enter, así que con teclado no había forma de salir.
 */
export default function BotonSalir({ anchoCompleto = false }: { anchoCompleto?: boolean }) {
    const router = useRouter();

    const { mutate: logoutFn, isPending } = trpc.logoutUser.useMutation({
        onError(error) {
            toast.error(error.message);
        },
        onSuccess() {
            queryClient.clear();
            toast.success('Sesión cerrada');
            router.push('/login');
            router.refresh();
        },
    });

    return (
        <Boton
            variante="secundario"
            tamano={anchoCompleto ? 'md' : 'sm'}
            anchoCompleto={anchoCompleto}
            disabled={isPending}
            onClick={() => logoutFn()}
        >
            {isPending ? 'Saliendo…' : 'Salir'}
        </Boton>
    );
}
