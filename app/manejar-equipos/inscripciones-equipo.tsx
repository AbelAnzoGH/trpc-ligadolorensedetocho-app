'use client';

import { useCallback, useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { trpcQuery, trpcMutation } from '@/utils/trpc-fetch';
import { useConfirmar } from '@/components/use-confirmar';
import Boton from '@/components/ui/boton';
import Insignia from '@/components/ui/insignia';
import { Cargando, MensajeError, Nota } from '@/components/ui/estado';
import { claseCampo } from '@/components/ui/campo';
import { claseAccionesFila } from '@/components/ui/lista';
import { cn } from '@/lib/cn';
import { etiquetaCategoria } from '@/lib/team-ui';
import type { TeamCategory } from '@/lib/team-schema';
import {
    nombreTemporada,
    etiquetaEstado,
    tonoEstadoTemporada,
    type TeamSeason,
    type ListTeamSeasonsResponse,
} from '@/lib/season-ui';

/**
 * Las inscripciones de UN equipo, dentro de "Editar equipo" en
 * /manejar-equipos. Sirve para corregir errores de inscripción (p. ej. un
 * equipo inscrito por accidente en la categoría equivocada):
 *
 *   - Cambiar la categoría de una inscripción.
 *   - Darla de baja. Si el equipo se queda sin inscripciones, ya se puede
 *     eliminar el equipo completo.
 *
 * Las dos cosas SOLO con la inscripción VACÍA: sin jugadores y sin partidos
 * (ni programados ni jugados; un partido con marcador es historial).
 * Decisión de Abel. El servidor lo exige (updateTeamSeason / removeTeamSeason);
 * aquí solo se evita ofrecer lo que de todos modos rechazaría, y se dice por qué.
 */
export default function InscripcionesEquipo({
    teamId,
    onCambio,
}: {
    teamId: string;
    /** Avisa al panel para que recargue la lista (su conteo de inscripciones). */
    onCambio: () => Promise<void>;
}) {
    const [inscripciones, setInscripciones] = useState<TeamSeason[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [guardando, setGuardando] = useState(false);
    const { confirmar, modalConfirmar } = useConfirmar();

    const cargar = useCallback(async () => {
        setError(null);
        try {
            const r = await trpcQuery<ListTeamSeasonsResponse>('listTeamSeasons', { teamId });
            setInscripciones(r.data.teamSeasons);
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setCargando(false);
        }
    }, [teamId]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const ejecutar = async (accion: () => Promise<unknown>, exito: string) => {
        setGuardando(true);
        try {
            await accion();
            toast.success(exito);
            await Promise.all([cargar(), onCambio()]);
        } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Error desconocido');
        } finally {
            setGuardando(false);
        }
    };

    const onCambiarCategoria = (i: TeamSeason, category: TeamCategory) =>
        ejecutar(
            () => trpcMutation('updateTeamSeason', { id: i.id, category }),
            `${nombreTemporada(i.season.league, i.season.number)}: ahora en ${etiquetaCategoria[category].toLowerCase()}`,
        );

    const onDarDeBaja = async (i: TeamSeason) => {
        const temporada = nombreTemporada(i.season.league, i.season.number);
        const ok = await confirmar({
            titulo: 'Dar de baja la inscripción',
            mensaje: (
                <>
                    ¿Estás seguro de que quieres dar de baja a <strong className="text-tinta">{i.team.name}</strong> de{' '}
                    {temporada} · {etiquetaCategoria[i.category].toLowerCase()}?
                </>
            ),
            textoConfirmar: 'Dar de baja',
            aviso: 'El equipo no se borra: solo deja de estar inscrito en esa temporada y categoría.',
        });
        if (!ok) return;
        await ejecutar(
            () => trpcMutation('removeTeamSeason', { id: i.id }),
            `${i.team.name} dado de baja de ${temporada}`,
        );
    };

    return (
        <div className="space-y-3 border-t border-borde pt-5">
            <div>
                <h3 className="text-cuerpo font-semibold text-tinta">Inscripciones</h3>
                <p className="text-meta text-tenue">
                    Corrige una inscripción hecha por error. Solo se puede si todavía no tiene jugadores ni partidos.
                </p>
            </div>

            {cargando ? (
                <Cargando texto="Cargando inscripciones…" />
            ) : error ? (
                <MensajeError>{error}</MensajeError>
            ) : inscripciones.length === 0 ? (
                <Nota>Este equipo no está inscrito en ninguna temporada. Ya se puede eliminar.</Nota>
            ) : (
                <ul className="space-y-2">
                    {inscripciones.map((i) => (
                        <FilaInscripcion
                            key={`${i.id}:${i.category}`}
                            inscripcion={i}
                            guardando={guardando}
                            onCambiarCategoria={(c) => onCambiarCategoria(i, c)}
                            onDarDeBaja={() => onDarDeBaja(i)}
                        />
                    ))}
                </ul>
            )}

            {modalConfirmar}
        </div>
    );
}

function FilaInscripcion({
    inscripcion: i,
    guardando,
    onCambiarCategoria,
    onDarDeBaja,
}: {
    inscripcion: TeamSeason;
    guardando: boolean;
    onCambiarCategoria: (c: TeamCategory) => void;
    onDarDeBaja: () => void;
}) {
    // La key de la fila incluye la categoría: al guardar un cambio, la fila se
    // vuelve a montar y este estado arranca con el valor nuevo.
    const [categoria, setCategoria] = useState<TeamCategory>(i.category);

    const jugadores = i._count.memberships;
    const partidos = i._count.homeGames + i._count.awayGames;
    const editable = jugadores === 0 && partidos === 0;

    return (
        <li className="space-y-2 rounded-item border border-borde bg-canvas p-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="min-w-0">
                    <span className="flex flex-wrap items-center gap-2">
                        <span className="font-semibold text-tinta">{nombreTemporada(i.season.league, i.season.number)}</span>
                        <Insignia tono={tonoEstadoTemporada[i.season.status]}>{etiquetaEstado[i.season.status]}</Insignia>
                    </span>
                    <span className="text-meta text-tenue">
                        {etiquetaCategoria[i.category]} · {jugadores} {jugadores === 1 ? 'jugador' : 'jugadores'} ·{' '}
                        {partidos} {partidos === 1 ? 'partido' : 'partidos'}
                    </span>
                </div>

                {editable && (
                    <span className={claseAccionesFila}>
                        <label htmlFor={`categoria-${i.id}`} className="sr-only">
                            Categoría
                        </label>
                        <select
                            id={`categoria-${i.id}`}
                            value={categoria}
                            onChange={(e) => setCategoria(e.target.value as TeamCategory)}
                            disabled={guardando}
                            className={cn(claseCampo, 'h-8 py-0 text-meta')}
                        >
                            {i.season.categories.map((c) => (
                                <option key={c} value={c}>
                                    {etiquetaCategoria[c]}
                                </option>
                            ))}
                        </select>
                        <Boton
                            variante="secundario"
                            tamano="sm"
                            disabled={guardando || categoria === i.category}
                            onClick={() => onCambiarCategoria(categoria)}
                        >
                            Cambiar categoría
                        </Boton>
                        <Boton variante="peligro" tamano="sm" disabled={guardando} onClick={onDarDeBaja}>
                            Dar de baja
                        </Boton>
                    </span>
                )}
            </div>

            {/* Por qué no se puede tocar: en `aviso`, sin caja (design.md →
                avisos dentro de un formulario). */}
            {!editable && (
                <p className="text-meta text-aviso">
                    {partidos > 0
                        ? `Tiene ${partidos} ${partidos === 1 ? 'partido' : 'partidos'} en el rol: no se puede cambiar de categoría ni dar de baja. Si son programados, bórralos primero en Manejar partidos (los jugados son historial y no se borran).`
                        : `Tiene ${jugadores} ${jugadores === 1 ? 'jugador' : 'jugadores'}: para cambiar la categoría o darla de baja, quítalos primero desde Plantel.`}
                </p>
            )}
        </li>
    );
}
