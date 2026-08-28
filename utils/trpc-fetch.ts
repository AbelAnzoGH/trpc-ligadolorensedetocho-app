/**
 * Helper mínimo para llamar endpoints de tRPC con `fetch`.
 *
 * ¿Por qué existe este archivo? Porque este proyecto configura tRPC con
 * SuperJSON (ver utils/trpc-server.ts). Eso cambia la forma del "sobre"
 * de la petición y de la respuesta:
 *
 *   - Lo que MANDAS va envuelto en { json: <tus datos> }
 *   - Lo que RECIBES viene en   { result: { data: { json: <lo que devolvió tu handler> } } }
 *   - Los errores vienen en     { error: { json: { message, code, ... } } }
 *
 * Escribir eso a mano en cada página es fácil de equivocar, así que estas
 * dos funciones lo encapsulan una sola vez.
 */

const unwrap = async <T>(res: Response): Promise<T> => {
    const json = await res.json().catch(() => null);

    if (!res.ok) {
        const message =
            json?.error?.json?.message ??
            json?.error?.message ??
            `Error ${res.status}`;
        throw new Error(message);
    }

    return json?.result?.data?.json as T;
};

/** Para endpoints declarados con .query(...) — solo leen datos. */
export const trpcQuery = async <T>(procedure: string, input?: unknown): Promise<T> => {
    const url =
        input === undefined
            ? `/api/trpc/${procedure}`
            : `/api/trpc/${procedure}?input=${encodeURIComponent(JSON.stringify({ json: input }))}`;

    const res = await fetch(url, {
        method: 'GET',
        credentials: 'include', // manda la cookie de sesión
    });

    return unwrap<T>(res);
};

/** Para endpoints declarados con .mutation(...) — crean, actualizan o borran. */
export const trpcMutation = async <T>(procedure: string, input?: unknown): Promise<T> => {
    const res = await fetch(`/api/trpc/${procedure}`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json: input ?? null }),
    });

    return unwrap<T>(res);
};
