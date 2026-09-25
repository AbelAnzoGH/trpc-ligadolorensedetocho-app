import { cn } from '@/lib/cn';

/**
 * Foto redonda de una persona, con sus iniciales si no tiene foto.
 * Es la única forma en que el sitio pinta a un jugador, para que se vea
 * igual en el plantel público, en /jugadores y en la administración.
 *
 * Tamaño fijo + shrink-0: la foto nunca se encoge aunque el nombre de al
 * lado sea largo.
 */
export default function Avatar({
    src,
    nombre,
    apellido = '',
    tamano = 56,
    className,
}: {
    src: string | null | undefined;
    nombre: string;
    apellido?: string;
    /** Lado en píxeles. */
    tamano?: number;
    className?: string;
}) {
    const iniciales = `${nombre[0] ?? ''}${apellido[0] ?? ''}`.toUpperCase();

    return (
        <span
            className={cn(
                'flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-borde bg-superficie-2',
                className,
            )}
            style={{ width: tamano, height: tamano }}
        >
            {src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={src}
                    alt={`Foto de ${nombre} ${apellido}`.trim()}
                    loading="lazy"
                    className="h-full w-full object-cover"
                />
            ) : (
                <span aria-hidden className="font-semibold text-tinta-2" style={{ fontSize: tamano * 0.34 }}>
                    {iniciales}
                </span>
            )}
        </span>
    );
}
