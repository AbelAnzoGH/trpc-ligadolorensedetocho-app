import Tarjeta from './ui/tarjeta';

/**
 * Caja de "sección todavía vacía".
 *
 * Sirve para que la página de inicio ya tenga su estructura final aunque
 * el contenido no exista: así se ve cómo va a quedar, y cuando llegue la
 * funcionalidad solo se reemplaza el interior de la caja.
 *
 * `children` es opcional: si no se pasa nada, muestra el aviso de
 * "Próximamente"; si se pasa contenido, lo muestra en su lugar.
 *
 * Diseño: es una <Tarjeta> pública (radio 36px) y el aviso sigue el patrón
 * de "Estados vacíos" de design.md: borde punteado y radio `rounded-item`,
 * menor que el de la tarjeta que lo contiene.
 */
export default function SeccionPlaceholder({
    titulo,
    descripcion,
    aviso = 'Próximamente',
    children,
}: {
    titulo: string;
    descripcion: string;
    aviso?: string;
    children?: React.ReactNode;
}) {
    return (
        <Tarjeta as="section" className="flex h-full flex-col">
            <h2 className="text-subtitulo font-semibold text-tinta">{titulo}</h2>
            <p className="mt-1 text-meta text-tenue">{descripcion}</p>

            <div className="mt-6 flex-1">
                {children ?? (
                    <div className="flex h-full min-h-40 items-center justify-center rounded-item border border-dashed border-borde-fuerte p-6">
                        {/* text-tenue y no text-apagado: el aviso SÍ hay que leerlo. */}
                        <p className="text-meta font-medium text-tenue">{aviso}</p>
                    </div>
                )}
            </div>
        </Tarjeta>
    );
}
