/**
 * El logo de un equipo, tal cual: sin círculo, borde ni fondo, para que los
 * logos (cada uno con su forma) se vean parejos sobre el fondo del sitio.
 * Siempre ocupa el mismo cuadro invisible de `tamano` px, así todos quedan
 * alineados aunque uno sea ancho y otro alto (object-contain).
 * Si el equipo no tiene logo, muestra sus iniciales ("Halcones Rojos" → "HR")
 * para que el lugar nunca quede vacío.
 * Sin 'use client': no tiene estado, sirve en servidor y en cliente.
 */
export default function LogoEquipo({
    nombre,
    logoUrl,
    tamano = 56,
}: {
    nombre: string;
    logoUrl: string | null;
    /** Lado en píxeles. */
    tamano?: number;
}) {
    const iniciales = nombre
        .split(/\s+/)
        .filter(Boolean)
        .slice(0, 2)
        .map((palabra) => palabra[0]!.toUpperCase())
        .join('');

    return (
        <span
            className="flex shrink-0 items-center justify-center"
            style={{ width: tamano, height: tamano }}
        >
            {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt={nombre} className="h-full w-full object-contain" />
            ) : (
                <span className="font-bold text-tenue" style={{ fontSize: tamano * 0.32 }} aria-label={nombre}>
                    {iniciales}
                </span>
            )}
        </span>
    );
}
