/**
 * Logo de la liga: el logotipo "LDT" en los colores de la bandera.
 *
 * Está pegado como SVG en línea (no como <img src="/logo-liga.svg">) por dos
 * razones: no hay una petición extra al servidor, y el logo se puede recolorear
 * desde el código si algún día hace falta una versión en un solo tono.
 *
 * El archivo original de Illustrator traía dos cosas que hubo que quitar:
 *
 *   1. Una capa oculta (display:none) con un PNG incrustado en base64 que
 *      pesaba 170 KB de los 173 KB del archivo. No se veía, pero se descargaba.
 *
 *   2. Un bloque <style> con clases genéricas (.st0, .st1, .st2...). Eso es
 *      inofensivo en un archivo .svg suelto, pero al pegar el SVG dentro del
 *      HTML esas clases pasan a ser GLOBALES de la página: cualquier elemento
 *      del sitio con class="st4" se volvería blanco. Por eso los colores están
 *      ahora como atributos fill="..." directamente en cada path.
 *
 * El logo es apaisado (~2.26:1), así que conviene darle alto y dejar el ancho
 * automático: className="h-8 w-auto", no "h-8 w-8".
 *
 * Copia limpia del archivo suelto: public/logo-liga.svg
 */
export default function LogoLiga({
    className = 'h-8 w-auto',
    title = 'Ligadolorense de Tocho',
}: {
    className?: string;
    /** Texto alternativo. Pásalo vacío si el logo va junto al nombre escrito. */
    title?: string;
}) {
    return (
        <svg
            viewBox="0 0 749.02 331"
            className={className}
            stroke="#000"
            strokeWidth="2.75"
            strokeMiterlimit="10"
            role={title ? 'img' : 'presentation'}
            aria-label={title || undefined}
            aria-hidden={title ? undefined : true}
        >
            <path fill="#006837" d="M190.66,288.65H8.95L59.56,1.38h71.73l-39.45,225.04h109.99l-11.16,62.24Z" />
            <path fill="#ffffff" d="M367.2,1.38c34.8,0,59.64,8.78,74.52,26.33,10.89,13.3,16.34,29.92,16.34,49.88,0,7.18-.67,14.76-1.99,22.74l-15.54,88.98c-5.32,30.06-18.33,54.13-39.05,72.22-20.72,18.09-47.56,27.13-80.5,27.13h-115.96L255.62,1.38h111.58ZM342.09,63.62h-25.9l-28.29,162.79h37.86c12.48,0,22.25-3.39,29.29-10.17,7.04-6.78,11.89-17.89,14.55-33.32l11.56-65.44c1.06-5.85,1.59-11.17,1.59-15.96,0-25.27-13.55-37.91-40.65-37.91Z" />
            <path fill="#c1272d" d="M736.22,63.62h-98.03l-39.45,225.04h-72.13l39.45-225.04h-98.43l11.16-62.24h268.59l-11.16,62.24Z" />
            <path fill="#006837" d="M1.38,328.55v-19.95h196.06v19.95H1.38Z" />
            <path fill="#ffffff" d="M197.44,328.55v-19.95h247.07v19.95h-247.07Z" />
            <path fill="#c1272d" d="M444.51,328.55v-19.95h259.82v19.95h-259.82Z" />
        </svg>
    );
}
