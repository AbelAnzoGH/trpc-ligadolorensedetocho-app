import LogoEquipo from '@/components/logo-equipo';
import { etiquetaCategoria } from '@/lib/team-ui';
import {
    etiquetaEstadoPartido,
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

    // Sin jugar: 00 y 00 en gris. Jugado: el marcador real, y el ganador
    // resaltado (en un empate, los dos).
    const marcadorLocal = jugado ? dosDigitos(p.homeScore!) : '00';
    const marcadorVisitante = jugado ? dosDigitos(p.awayScore!) : '00';
    const claseMarcador = (propio: number | null, rival: number | null) =>
        !jugado
            ? 'text-gray-600'
            : propio! >= rival!
              ? 'text-white'
              : 'text-gray-500';

    const cuando = soloHora ? formatoHoraPartido(p.scheduledAt) : formatoFechaPartido(p.scheduledAt);

    return (
        <li>
            <button
                type="button"
                onClick={onAbrir}
                aria-label={`${local.name} contra ${visitante.name}, ${cuando}. Ver detalles.`}
                className="w-full space-y-3 rounded-xl border border-gray-800 bg-gray-900/40 p-4 transition hover:border-pink-500/50 focus:outline-none focus-visible:ring-2 focus-visible:ring-pink-500"
            >
                <div className="flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-semibold text-gray-200">{cuando}</span>
                    <span className="text-gray-400">· {etiquetaCategoria[p.homeTeamSeason.category]}</span>
                    {/* Solo se avisa lo que NO es normal: un programado no lleva etiqueta. */}
                    {p.status !== 'programado' && (
                        <span
                            className={`rounded-full border px-2 py-0.5 text-xs ${
                                jugado ? 'border-green-500/40 text-green-300' : 'border-red-500/40 text-red-300'
                            }`}
                        >
                            {p.isForfeit ? 'Default' : etiquetaEstadoPartido[p.status]}
                        </span>
                    )}
                </div>

                <div className="flex items-center justify-between gap-2">
                    <span className={`w-10 text-center text-2xl font-bold tabular-nums ${claseMarcador(p.homeScore, p.awayScore)}`}>
                        {marcadorLocal}
                    </span>
                    <LogoEquipo nombre={local.name} logoUrl={local.logoUrl} />
                    <span className="text-sm font-semibold text-gray-500">vs</span>
                    <LogoEquipo nombre={visitante.name} logoUrl={visitante.logoUrl} />
                    <span className={`w-10 text-center text-2xl font-bold tabular-nums ${claseMarcador(p.awayScore, p.homeScore)}`}>
                        {marcadorVisitante}
                    </span>
                </div>
            </button>
        </li>
    );
}
