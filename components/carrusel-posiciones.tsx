'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import Boton from '@/components/ui/boton';
import { claseEnlace } from '@/components/ui/enlace';
import TablaPosiciones from '@/components/tabla-posiciones';
import { cn } from '@/lib/cn';
import type { TablaCategoria } from '@/lib/tabla-ui';

/**
 * Carrusel de la portada: las tablas de las temporadas EN CURSO, una por
 * diapositiva, en su versión compacta. Avanza sola cada 10 segundos
 * (decisión de Abel), con flechas y puntos para moverse a mano.
 *
 * Detalles que no se ven pero importan:
 *
 *   - Se PAUSA mientras el mouse está encima o el foco del teclado está
 *     adentro: nadie quiere que la tabla cambie a media lectura. (Con dedo
 *     no se pausa por "hover": en un teléfono el hover se queda pegado
 *     después de tocar, y el carrusel se congelaría para siempre.)
 *   - Moverse a mano REINICIA la cuenta de 10 s: el temporizador se vuelve
 *     a crear cada vez que cambia `indice`.
 *   - Todas las diapositivas se pintan una encima de otra (misma celda de
 *     un grid), y solo la actual es visible. Así el carrusel mide lo que la
 *     tabla MÁS LARGA y la portada no brinca al cambiar de diapositiva.
 *   - Las ocultas llevan `inert`: el teclado y los lectores de pantalla no
 *     entran en ellas.
 *   - Con "reducir movimiento" activado en el sistema, cambian sin
 *     desvanecido.
 */

export type DiapositivaPosiciones = {
    /** `${seasonId}:${categoria}` — única en todo el carrusel. */
    clave: string;
    /** "LDT VII" */
    temporada: string;
    /** "Varonil libre" */
    categoria: string;
    tabla: TablaCategoria;
    conEmpates: boolean;
};

const INTERVALO_MS = 10_000;

export default function CarruselPosiciones({ diapositivas }: { diapositivas: DiapositivaPosiciones[] }) {
    const [indice, setIndice] = useState(0);
    const [conMouse, setConMouse] = useState(false);
    const [conFoco, setConFoco] = useState(false);

    const total = diapositivas.length;
    const pausado = conMouse || conFoco;

    useEffect(() => {
        if (total <= 1 || pausado) return;
        const temporizador = setTimeout(() => setIndice((i) => (i + 1) % total), INTERVALO_MS);
        return () => clearTimeout(temporizador);
    }, [indice, total, pausado]);

    // El "+ total" hace que ir(-1) desde la primera dé la última.
    const ir = (i: number) => setIndice((i + total) % total);

    if (total === 0) return null;

    return (
        <div
            role="region"
            aria-roledescription="carrusel"
            aria-label="Tablas de posiciones de las temporadas en curso"
            onPointerEnter={(e) => e.pointerType === 'mouse' && setConMouse(true)}
            onPointerLeave={() => setConMouse(false)}
            onFocus={() => setConFoco(true)}
            onBlur={(e) => {
                // Solo cuenta como "salir" si el foco se fue FUERA del carrusel,
                // no si pasó de una flecha a un punto.
                if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setConFoco(false);
            }}
        >
            <div className="grid">
                {diapositivas.map((d, i) => {
                    const actual = i === indice;
                    return (
                        <div
                            key={d.clave}
                            role="group"
                            aria-roledescription="diapositiva"
                            aria-label={`${i + 1} de ${total}: ${d.temporada} · ${d.categoria}`}
                            inert={!actual}
                            className={cn(
                                'col-start-1 row-start-1',
                                'transition-[opacity,visibility] duration-500 motion-reduce:transition-none',
                                actual ? 'visible opacity-100' : 'invisible opacity-0',
                            )}
                        >
                            <p className="mb-3 text-cuerpo font-semibold text-tinta-2">
                                {d.temporada}
                                <span className="font-normal text-tenue"> · {d.categoria}</span>
                            </p>
                            <TablaPosiciones
                                tabla={d.tabla}
                                conEmpates={d.conEmpates}
                                temporada={d.temporada}
                                variante="compacta"
                            />
                        </div>
                    );
                })}
            </div>

            <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
                {total > 1 ? (
                    <div className="flex items-center gap-1">
                        <Boton variante="fantasma" tamano="sm" className="px-2" aria-label="Tabla anterior" onClick={() => ir(indice - 1)}>
                            <Flecha direccion="izquierda" />
                        </Boton>

                        <div className="flex flex-wrap items-center">
                            {diapositivas.map((d, i) => (
                                <button
                                    key={d.clave}
                                    type="button"
                                    onClick={() => ir(i)}
                                    aria-label={`Ver ${d.temporada} · ${d.categoria}`}
                                    aria-current={i === indice || undefined}
                                    // El punto mide 8px, pero el botón deja 6px alrededor
                                    // para que se pueda tocar con el dedo.
                                    className="group rounded-full p-1.5"
                                >
                                    <span
                                        className={cn(
                                            'block size-2 rounded-full transition-colors',
                                            i === indice ? 'bg-tinta' : 'bg-borde-fuerte group-hover:bg-tenue',
                                        )}
                                    />
                                </button>
                            ))}
                        </div>

                        <Boton variante="fantasma" tamano="sm" className="px-2" aria-label="Tabla siguiente" onClick={() => ir(indice + 1)}>
                            <Flecha direccion="derecha" />
                        </Boton>
                    </div>
                ) : (
                    <span />
                )}

                <Link href="/posiciones" className={cn(claseEnlace, 'text-meta')}>
                    Ver todas las tablas
                </Link>
            </div>
        </div>
    );
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
