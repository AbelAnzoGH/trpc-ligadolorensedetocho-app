'use client';

import { claseCampo, claseEtiqueta, claseGrupoCampo } from '@/components/ui/campo';
import { romano, etiquetaEstado, type League } from '@/lib/season-ui';

/**
 * Dos <select> encadenados: primero la liga, luego la temporada de esa liga.
 *
 * Es "controlado": no guarda estado propio. Recibe el árbol de ligas y el
 * seasonId elegido, y avisa con onChange. Quien lo usa (normalmente junto
 * con el hook useLigas) decide qué hacer con el cambio.
 *
 * Al cambiar de liga se elige sola la temporada activa de esa liga o, si no
 * tiene, la más reciente: así nunca queda una liga elegida sin temporada.
 */
export default function SelectorTemporada({
    ligas,
    seasonId,
    onChange,
    idPrefix = 'sel',
}: {
    ligas: League[];
    seasonId: string;
    onChange: (seasonId: string) => void;
    /** Para que los id de los <label> no choquen si hay dos selectores en la página. */
    idPrefix?: string;
}) {
    const ligaActual = ligas.find((l) => l.seasons.some((s) => s.id === seasonId)) ?? null;

    const cambiarLiga = (leagueId: string) => {
        const liga = ligas.find((l) => l.id === leagueId);
        if (!liga) return;
        const activa = liga.seasons.find((s) => s.status === 'activa');
        onChange(activa?.id ?? liga.seasons[0]?.id ?? '');
    };

    if (ligas.length === 0) {
        return <p className="text-meta text-tenue">Todavía no hay ligas registradas.</p>;
    }

    return (
        <div className="flex flex-wrap items-end gap-3">
            <div className={claseGrupoCampo}>
                <label htmlFor={`${idPrefix}-liga`} className={claseEtiqueta}>
                    Liga
                </label>
                <select
                    id={`${idPrefix}-liga`}
                    value={ligaActual?.id ?? ''}
                    onChange={(e) => cambiarLiga(e.target.value)}
                    className={`${claseCampo} min-w-40`}
                >
                    {!ligaActual && <option value="">Elige una liga</option>}
                    {ligas.map((liga) => (
                        <option key={liga.id} value={liga.id} disabled={liga.seasons.length === 0}>
                            {liga.name}
                            {liga.seasons.length === 0 ? ' (sin temporadas)' : ''}
                        </option>
                    ))}
                </select>
            </div>

            <div className={claseGrupoCampo}>
                <label htmlFor={`${idPrefix}-temporada`} className={claseEtiqueta}>
                    Temporada
                </label>
                <select
                    id={`${idPrefix}-temporada`}
                    value={seasonId}
                    onChange={(e) => onChange(e.target.value)}
                    disabled={!ligaActual}
                    className={`${claseCampo} min-w-56`}
                >
                    {ligaActual?.seasons.map((s) => (
                        <option key={s.id} value={s.id}>
                            Temporada {romano(s.number)} · {etiquetaEstado[s.status]}
                        </option>
                    ))}
                </select>
            </div>
        </div>
    );
}
