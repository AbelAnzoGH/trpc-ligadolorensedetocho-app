import LogoEquipo from '@/components/logo-equipo';
import Insignia from '@/components/ui/insignia';
import { etiquetaCategoria } from '@/lib/team-ui';
import {
    etiquetaEstadoPartido,
    tonoEstadoPartido,
    tonoDefault,
    formatoFechaPartido,
    formatoHoraPartido,
    type Game,
} from '@/lib/game-ui';

/** 0 → "00", 7 → "07", 36 → "36". */
const dosDigitos = (n: number) => String(n).padStart(2, '0');

/**
 * Un partido en su versión COMPACTA, para el rol público:
 *
 *        10:00 · Varonil Libre
 *     00  (logo)  vs  (logo)  00
 *
 * Solo logos, hora y marcador. Los detalles (nombres, sede, campo, notas...)
 * están a un clic, en PartidoDetalleModal. Es un <button> para que se pueda
 * abrir también con el teclado; el aria-label dice quién juega, porque los
 * logos solos no se leen.
 *
 * Diseño: es un elemento clicable, así que al hover sube un nivel
 * (bg-superficie-2 + borde fuerte), como toda tarjeta interactiva. El foco
 * de teclado lo pone el :focus-visible global.
 */
export default function PartidoCompacto({
    partido: p,
    soloHora = false,
    onAbrir,
}: {
    partido: Game;
    /** true si el día ya se dijo en el encabezado de la jornada. */
    soloHora?: boolean;
    onAbrir: () => void;
}) {
    const local = p.homeTeamSeason.team;
    const visitante = p.awayTeamSeason.team;
    const jugado = p.status === 'finalizado';

    // Sin jugar: 00 y 00 apagados. Jugado: el marcador real, el ganador en
    // tinta y el perdedor en tenue (en un empate, los dos en tinta).
    const marcadorLocal = jugado ? dosDigitos(p.homeScore!) : '00';
    const marcadorVisitante = jugado ? dosDigitos(p.awayScore!) : '00';
    const claseMarcador = (propio: number | null, rival: number | null) =>
        !jugado ? 'text-apagado' : propio! >= rival! ? 'text-tinta' : 'text-tenue';

    const cuando = soloHora ? formatoHoraPartido(p.scheduledAt) : formatoFechaPartido(p.scheduledAt);

    return (
        <li>
            <button
                type="button"
                onClick={onAbrir}
                aria-label={`${local.name} contra ${visitante.name}, ${cuando}. Ver detalles.`}
                className="w-full space-y-3 rounded-item border border-borde bg-superficie p-4 transition-colors hover:border-borde-fuerte hover:bg-superficie-2"
            >
                {/* min-h-6: con o sin insignia, la fila mide lo mismo y las
                    tarjetas quedan parejas en la rejilla. */}
                <div className="flex min-h-6 flex-wrap items-center justify-center gap-x-2 gap-y-1 text-meta">
                    <span className="font-medium text-tinta-2">{cuando}</span>
                    <span className="text-tenue">· {etiquetaCategoria[p.homeTeamSeason.category]}</span>
                    {/* Solo se avisa lo que NO es normal: un programado no lleva etiqueta. */}
                    {p.status !== 'programado' && (
                        <Insignia tono={p.isForfeit ? tonoDefault : tonoEstadoPartido[p.status]}>
                            {p.isForfeit ? 'Default' : etiquetaEstadoPartido[p.status]}
                        </Insignia>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className={`w-12 text-center text-titulo-sm leading-none font-bold tabular-nums ${claseMarcador(p.homeScore, p.awayScore)}`}>
                        {marcadorLocal}
                    </span>
                    <LogoEquipo nombre={local.name} logoUrl={local.logoUrl} />
                    <span className="text-leyenda font-medium uppercase tracking-wider text-apagado">vs</span>
                    <LogoEquipo nombre={visitante.name} logoUrl={visitante.logoUrl} />
                    <span className={`w-12 text-center text-titulo-sm leading-none font-bold tabular-nums ${claseMarcador(p.awayScore, p.homeScore)}`}>
                        {marcadorVisitante}
                    </span>
                </div>
            </button>
        </li>
    );
}
