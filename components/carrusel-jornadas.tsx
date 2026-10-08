'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Boton from '@/components/ui/boton';
import { claseEnlace } from '@/components/ui/enlace';
import PartidoCompacto from '@/components/partido-compacto';
import PartidoDetalleModal from '@/components/partido-detalle-modal';
import { cn } from '@/lib/cn';
import type { TeamCategory } from '@/lib/team-schema';
import { etiquetaCategoria } from '@/lib/team-ui';
import { agruparPorCategoria, formatoDiaPartido, type Game } from '@/lib/game-ui';

/**
 * Carrusel "Marcadores" de la portada: la ÚLTIMA JORNADA JUGADA de cada
 * liga, una liga por diapositiva. Mismo comportamiento que
 * CarruselPosiciones (avanza sola cada 10 s, se pausa con el mouse o el
 * foco encima, flechas y puntos, diapositivas apiladas para que la portada
 * no brinque). Ver los comentarios de ese archivo: aquí solo se explica lo
 * que cambia.
 *
 * Lo que cambia:
 *   - Cada diapositiva trae los partidos de TODAS las categorías de esa
 *     jornada, agrupados por categoría (en el orden fijo de la liga).
 *   - Un clic en un partido abre PartidoDetalleModal. Hay UN solo modal para
 *     todo el carrusel; mientras está abierto, el carrusel no avanza.
 *   - El enlace de abajo lleva al calendario completo de la liga de la
 *     diapositiva ACTUAL.
 */

export type DiapositivaJornada = {
    /** Única en el carrusel: el id de la temporada. */
    clave: string;
    /** "LDT VII" */
    temporada: string;
    /** /ligas/[slug]/[numero] */
    enlace: string;
    /** "Jornada 5", o el nombre de la fase si el grupo no tiene jornada. */
    titulo: string;
    /** Fecha de la jornada si todos sus partidos caen el mismo día; si no, null. */
    dia: string | null;
    partidos: Game[];
};

const INTERVALO_MS = 10_000;

export default function CarruselJornadas({ diapositivas }: { diapositivas: DiapositivaJornada[] }) {
    const [indice, setIndice] = useState(0);
    const [conMouse, setConMouse] = useState(false);
    const [conFoco, setConFoco] = useState(false);
    // Partido cuyos detalles se ven. null = modal cerrado.
    const [abierto, setAbierto] = useState<Game | null>(null);

    const total = diapositivas.length;
    const pausado = conMouse || conFoco || abierto !== null;

    useEffect(() => {
        if (total <= 1 || pausado) return;
        const temporizador = setTimeout(() => setIndice((i) => (i + 1) % total), INTERVALO_MS);
        return () => clearTimeout(temporizador);
    }, [indice, total, pausado]);

    const ir = (i: number) => setIndice((i + total) % total);

    if (total === 0) return null;

    // Si una recarga de datos dejara menos diapositivas, no quedarse apuntando afuera.
    const actual = diapositivas[Math.min(indice, total - 1)];

    return (
        <div
            role="region"
            aria-roledescription="carrusel"
            aria-label="Marcadores de la última jornada de cada liga"
            onPointerEnter={(e) => e.pointerType === 'mouse' && setConMouse(true)}
            onPointerLeave={() => setConMouse(false)}
            onFocus={() => setConFoco(true)}
            onBlur={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setConFoco(false);
            }}
        >
            <div className="grid">
                {diapositivas.map((d, i) => {
                    const visible = d.clave === actual.clave;
                    return (
                        <div
                            key={d.clave}
                            role="group"
                            aria-roledescription="diapositiva"
                            aria-label={`${i + 1} de ${total}: ${d.temporada} · ${d.titulo}`}
                            inert={!visible}
                            className={cn(
                                'col-start-1 row-start-1',
                                'transition-[opacity,visibility] duration-500 motion-reduce:transition-none',
                                visible ? 'visible opacity-100' : 'invisible opacity-0',
                            )}
                        >
                            <p className="mb-4 text-cuerpo font-semibold text-tinta-2">
                                {d.temporada}
                                <span className="font-normal text-tenue">
                                    {' '}· {d.titulo}
                                    {d.dia && ` · ${formatoDiaPartido(d.dia)}`}
                                </span>
                            </p>

                            <div className="space-y-6">
                                {agruparPorCategoria(d.partidos).map((grupo) => (
                                    <div key={grupo.categoria} className="space-y-3">
                                        <CategoriaTitulo categoria={grupo.categoria} />
                                        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                                            {grupo.partidos.map((p) => (
                                                <PartidoCompacto
                                                    key={p.id}
                                                    partido={p}
                                                    soloHora={d.dia !== null}
                                                    onAbrir={() => setAbierto(p)}
                                                />
                                            ))}
                                        </ul>
                                    </div>
                                ))}
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
                {total > 1 ? (
                    <div className="flex items-center gap-1">
                        <Boton variante="fantasma" tamano="sm" className="px-2" aria-label="Liga anterior" onClick={() => ir(indice - 1)}>
                            <Flecha direccion="izquierda" />
                        </Boton>

                        <div className="flex flex-wrap items-center">
                            {diapositivas.map((d, i) => (
                                <button
                                    key={d.clave}
                                    type="button"
                                    onClick={() => ir(i)}
                                    aria-label={`Ver ${d.temporada} · ${d.titulo}`}
                                    aria-current={d.clave === actual.clave || undefined}
                                    className="group rounded-full p-1.5"
                                >
                                    <span
                                        className={cn(
                                            'block size-2 rounded-full transition-colors',
                                            d.clave === actual.clave ? 'bg-tinta' : 'bg-borde-fuerte group-hover:bg-tenue',
                                        )}
                                    />
                                </button>
                            ))}
                        </div>

                        <Boton variante="fantasma" tamano="sm" className="px-2" aria-label="Liga siguiente" onClick={() => ir(indice + 1)}>
                            <Flecha direccion="derecha" />
                        </Boton>
                    </div>
                ) : (
                    <span />
                )}

                <Link href={actual.enlace} className={cn(claseEnlace, 'text-meta')}>
                    Ver calendario completo de {actual.temporada}
                </Link>
            </div>

            <PartidoDetalleModal partido={abierto} onCerrar={() => setAbierto(null)} />
        </div>
    );
}

function CategoriaTitulo({ categoria }: { categoria: TeamCategory }) {
    return <h3 className="text-meta font-semibold text-tenue">{etiquetaCategoria[categoria]}</h3>;
}

function Flecha({ direccion }: { direccion: 'izquierda' | 'derecha' }) {
    return (
        <svg
            aria-hidden
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
            className="size-4"
        >
            <path d={direccion === 'izquierda' ? 'M15 6l-6 6 6 6' : 'M9 6l6 6-6 6'} />
        </svg>
    );
}
