'use client';

import { useState } from 'react';
import toast from 'react-hot-toast';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria, inputClass } from '@/lib/team-ui';
import type { TeamSeason } from '@/lib/season-ui';
import { gamePhases, type GamePhase } from '@/lib/game-schema';
import {
    etiquetaFase,
    separarFechaHora,
    unirFechaHora,
    diaDeLiga,
    type Game,
    type Venue,
} from '@/lib/game-ui';
import { CampoFecha, CampoHora } from './campos-fecha';

/** Lo que el formulario entrega. El panel le agrega seasonId (crear) o id (editar). */
export type DatosPartido = {
    homeTeamSeasonId: string;
    awayTeamSeasonId: string;
    phase: GamePhase;
    round: number | null;
    /** Texto ISO con la zona de la liga (ver unirFechaHora). */
    scheduledAt: string;
    venueId: string;
    field: number | null;
    notes: string | null;
};

const botonPrimario =
    'rounded-full bg-linear-to-r from-pink-500 to-yellow-500 px-5 py-2 font-semibold text-white transition duration-300 hover:bg-linear-to-l disabled:opacity-50';

/**
 * Formulario de un partido. El MISMO componente sirve para crear (en la
 * página) y para editar (dentro de un modal): la diferencia es si llega
 * `inicial`. Quien lo usa decide a qué endpoint mandar los datos.
 *
 * Al editar, el padre le pone `key={partido.id}` para que React lo monte de
 * nuevo con cada partido: así el estado inicial se toma otra vez y no queda
 * lo que se escribió en el anterior.
 */
export default function PartidoForm({
    inscripciones,
    partidos,
    categorias,
    sedes,
    inicial,
    textoBoton,
    guardando,
    onEnviar,
    idPrefix = 'nuevo',
}: {
    /** Los equipos inscritos en la temporada elegida. */
    inscripciones: TeamSeason[];
    /** Los partidos ya creados en la temporada: de aquí sale el día de cada jornada. */
    partidos: Game[];
    /** Las categorías de la temporada. */
    categorias: TeamCategory[];
    sedes: Venue[];
    inicial?: Game;
    textoBoton: string;
    guardando: boolean;
    /** Devuelve true si se guardó, para limpiar el formulario al crear. */
    onEnviar: (datos: DatosPartido) => Promise<boolean>;
    /** Para que los id de los <label> no choquen si hay dos formularios en pantalla. */
    idPrefix?: string;
}) {
    const [categoriaElegida, setCategoria] = useState<TeamCategory | ''>(inicial?.homeTeamSeason.category ?? '');
    const [local, setLocal] = useState(inicial?.homeTeamSeason.id ?? '');
    const [visitante, setVisitante] = useState(inicial?.awayTeamSeason.id ?? '');
    const [fase, setFase] = useState<GamePhase>(inicial?.phase ?? 'regular');
    const [jornada, setJornada] = useState(inicial?.round != null ? String(inicial.round) : '');
    const [fecha, setFecha] = useState(inicial ? separarFechaHora(inicial.scheduledAt).fecha : '');
    const [hora, setHora] = useState(inicial ? separarFechaHora(inicial.scheduledAt).hora : '');
    const [sedeElegida, setSede] = useState(inicial?.venue.id ?? '');
    const [campo, setCampo] = useState(inicial?.field != null ? String(inicial.field) : '');
    const [notas, setNotas] = useState(inicial?.notes ?? '');

    // Valores derivados (mismo patrón que /manejar-temporadas): si lo elegido
    // ya no es válido, se usa la primera opción que sí lo es.
    const categoria: TeamCategory | '' =
        categoriaElegida && categorias.includes(categoriaElegida) ? categoriaElegida : (categorias[0] ?? '');
    const sede = sedeElegida && sedes.some((s) => s.id === sedeElegida) ? sedeElegida : (sedes[0]?.id ?? '');

    // Solo se ofrecen equipos de la categoría elegida: así es imposible
    // armar "varonil contra mixto" desde la pantalla (el servidor también lo
    // rechaza, pero es mejor no ofrecer la opción).
    const equiposCategoria = inscripciones.filter((i) => i.category === categoria);

    // El día de una jornada = el día de sus partidos ya creados (el del
    // primero, que el servidor manda ordenados por fecha). null si todavía
    // no tiene ninguno.
    const diaDeJornada = (numero: number) => {
        const primero = partidos.find((p) => p.round === numero && p.id !== inicial?.id);
        return primero ? diaDeLiga(primero.scheduledAt) : null;
    };

    // Al CREAR, elegir una jornada que ya tiene partidos pone su día en la
    // fecha: así en una jornada solo se elige la hora de cada partido.
    // Es un manejador de evento y no un useEffect: la fecha cambia porque el
    // admin cambió la jornada, no "cada vez que algo se renderiza".
    const onCambiarJornada = (valor: string) => {
        setJornada(valor);
        if (inicial || !valor) return;
        const dia = diaDeJornada(Number(valor));
        if (dia) setFecha(dia);
    };
    const diaJornadaActual = jornada ? diaDeJornada(Number(jornada)) : null;
    const localValido = equiposCategoria.some((i) => i.id === local) ? local : '';
    const visitanteValido =
        visitante !== localValido && equiposCategoria.some((i) => i.id === visitante) ? visitante : '';

    const onSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!localValido || !visitanteValido) {
            toast.error('Elige al equipo local y al visitante');
            return;
        }
        if (!fecha || !hora) {
            toast.error('La fecha y la hora son obligatorias');
            return;
        }
        if (!sede) {
            toast.error('Elige la sede');
            return;
        }
        if (fase === 'regular' && !jornada) {
            toast.error('Un partido de temporada regular necesita jornada');
            return;
        }

        const ok = await onEnviar({
            homeTeamSeasonId: localValido,
            awayTeamSeasonId: visitanteValido,
            phase: fase,
            round: jornada ? Number(jornada) : null,
            scheduledAt: unirFechaHora(fecha, hora),
            venueId: sede,
            field: campo ? Number(campo) : null,
            notes: notas.trim() || null,
        });

        // Al crear se limpian los equipos pero se CONSERVAN categoría, fase,
        // jornada, fecha, hora y sede: al armar un rol casi siempre se
        // capturan varios partidos seguidos de la misma jornada.
        if (ok && !inicial) {
            setLocal('');
            setVisitante('');
            setCampo('');
            setNotas('');
        }
    };

    if (categorias.length === 0) {
        return <p className="text-sm text-gray-400">Esta temporada no tiene categorías. Agrégalas en /manejar-temporadas.</p>;
    }
    if (sedes.length === 0) {
        return <p className="text-sm text-gray-400">Registra al menos una sede antes de crear partidos.</p>;
    }

    const opcionesEquipos = (excluir: string) =>
        equiposCategoria
            .filter((i) => i.id !== excluir)
            .map((i) => (
                <option key={i.id} value={i.id}>{i.team.name}</option>
            ));

    return (
        <form onSubmit={onSubmit} className="space-y-4">
            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-categoria`} className="text-sm text-gray-300">Categoría</label>
                    <select
                        id={`${idPrefix}-categoria`}
                        value={categoria}
                        onChange={(e) => setCategoria(e.target.value as TeamCategory)}
                        className={inputClass}
                    >
                        {categorias.map((c) => (
                            <option key={c} value={c}>{etiquetaCategoria[c]}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-local`} className="text-sm text-gray-300">Local</label>
                    <select id={`${idPrefix}-local`} value={localValido} onChange={(e) => setLocal(e.target.value)} className={inputClass}>
                        <option value="">Elige al local</option>
                        {opcionesEquipos('')}
                    </select>
                </div>
                <span className="pb-2 text-gray-500">vs</span>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-visitante`} className="text-sm text-gray-300">Visitante</label>
                    <select
                        id={`${idPrefix}-visitante`}
                        value={visitanteValido}
                        onChange={(e) => setVisitante(e.target.value)}
                        className={inputClass}
                    >
                        <option value="">Elige al visitante</option>
                        {opcionesEquipos(localValido)}
                    </select>
                </div>
            </div>
            {equiposCategoria.length < 2 && (
                <p className="text-sm text-yellow-300">
                    Hay menos de dos equipos inscritos en {etiquetaCategoria[categoria as TeamCategory]}.
                </p>
            )}

            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-fase`} className="text-sm text-gray-300">Fase</label>
                    <select id={`${idPrefix}-fase`} value={fase} onChange={(e) => setFase(e.target.value as GamePhase)} className={inputClass}>
                        {gamePhases.map((f) => (
                            <option key={f} value={f}>{etiquetaFase[f]}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-jornada`} className="text-sm text-gray-300">
                        Jornada {fase === 'regular' ? '' : '(opcional)'}
                    </label>
                    <input
                        id={`${idPrefix}-jornada`}
                        type="number"
                        min={1}
                        value={jornada}
                        onChange={(e) => onCambiarJornada(e.target.value)}
                        className={`${inputClass} w-24`}
                    />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-fecha`} className="text-sm text-gray-300">Fecha</label>
                    <CampoFecha id={`${idPrefix}-fecha`} valor={fecha} onChange={setFecha} />
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-hora`} className="text-sm text-gray-300">Hora</label>
                    <CampoHora id={`${idPrefix}-hora`} valor={hora} onChange={setHora} />
                </div>
            </div>

            {diaJornadaActual && fecha && fecha !== diaJornadaActual && (
                <p className="text-sm text-yellow-300">
                    Ojo: los otros partidos de la jornada {jornada} son en otro día.
                </p>
            )}

            <div className="flex flex-wrap items-end gap-3">
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-sede`} className="text-sm text-gray-300">Sede</label>
                    <select id={`${idPrefix}-sede`} value={sede} onChange={(e) => setSede(e.target.value)} className={inputClass}>
                        {sedes.map((s) => (
                            <option key={s.id} value={s.id}>{s.name}</option>
                        ))}
                    </select>
                </div>
                <div className="flex flex-col gap-1">
                    <label htmlFor={`${idPrefix}-campo`} className="text-sm text-gray-300">Campo (opcional)</label>
                    <input
                        id={`${idPrefix}-campo`}
                        type="number"
                        min={1}
                        value={campo}
                        onChange={(e) => setCampo(e.target.value)}
                        className={`${inputClass} w-24`}
                    />
                </div>
                <div className="flex min-w-48 flex-1 flex-col gap-1">
                    <label htmlFor={`${idPrefix}-notas`} className="text-sm text-gray-300">Notas (opcional)</label>
                    <input
                        id={`${idPrefix}-notas`}
                        value={notas}
                        maxLength={500}
                        onChange={(e) => setNotas(e.target.value)}
                        className={inputClass}
                        placeholder="Ej. suspendido por lluvia"
                    />
                </div>
            </div>

            <button type="submit" disabled={guardando} className={botonPrimario}>
                {textoBoton}
            </button>
        </form>
    );
}
