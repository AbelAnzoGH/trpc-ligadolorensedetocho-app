'use client';

import { useCallback, useEffect, useState } from 'react';
import { trpcQuery } from '@/utils/trpc-fetch';
import {
    temporadaPorDefecto,
    buscarTemporada,
    type League,
    type ListLeaguesResponse,
} from '@/lib/season-ui';

/**
 * Hook compartido por todas las pantallas que trabajan "dentro de una
 * temporada" (/equipos, /jugadores y los paneles de admin).
 *
 * Hace dos cosas:
 *   1. Trae el árbol de ligas → temporadas con UNA sola llamada (listLeagues).
 *   2. Recuerda qué temporada eligió el usuario y, mientras no elija nada,
 *      propone la de por defecto (la activa de la LDT; ver temporadaPorDefecto).
 *
 * Así cada pantalla no repite el mismo useEffect ni la misma regla de
 * "cuál temporada se muestra primero".
 */
export function useLigas() {
    const [ligas, setLigas] = useState<League[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [seasonId, setSeasonId] = useState('');

    const recargar = useCallback(async () => {
        setError(null);
        try {
            const data = await trpcQuery<ListLeaguesResponse>('listLeagues');
            const nuevas = data.data.leagues;
            setLigas(nuevas);

            // Si la temporada elegida ya no existe (o nunca se eligió),
            // se cae a la de por defecto. La forma funcional de setState lee
            // el valor MÁS RECIENTE, no el que había cuando se creó la función.
            setSeasonId((actual) =>
                actual && buscarTemporada(nuevas, actual)
                    ? actual
                    : (temporadaPorDefecto(nuevas)?.temporada.id ?? ''),
            );
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        recargar();
    }, [recargar]);

    return {
        ligas,
        cargando,
        error,
        seasonId,
        setSeasonId,
        recargar,
        /** La liga y la temporada elegidas, o null si todavía no hay. */
        elegida: seasonId ? buscarTemporada(ligas, seasonId) : null,
    };
}
