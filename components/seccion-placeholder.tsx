/**
 * Caja de "sección todavía vacía".
 *
 * Sirve para que la página de inicio ya tenga su estructura final aunque
 * el contenido no exista: así se ve cómo va a quedar, y cuando llegue la
 * funcionalidad solo se reemplaza el interior de la caja.
 *
 * `children` es opcional: si no se pasa nada, muestra el aviso de
 * "Próximamente"; si se pasa contenido, lo muestra en su lugar.
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
        <section className="flex h-full flex-col rounded-xl border border-gray-800 bg-gray-900/40 p-6">
            <h2 className="text-xl font-semibold text-white">{titulo}</h2>
            <p className="mt-1 text-sm text-gray-400">{descripcion}</p>

            <div className="mt-5 flex-1">
                {children ?? (
                    <div className="flex h-full min-h-40 items-center justify-center rounded-lg border border-dashed border-gray-700 p-6">
                        <p className="text-sm font-semibold uppercase tracking-widest text-gray-600">
                            {aviso}
                        </p>
                    </div>
                )}
            </div>
        </section>
    );
}
