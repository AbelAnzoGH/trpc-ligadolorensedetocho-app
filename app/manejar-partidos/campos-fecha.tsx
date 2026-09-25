'use client';

import { cn } from '@/lib/cn';
import { claseCampo } from '@/components/ui/campo';
import { separarFechaHora } from '@/lib/game-ui';

/**
 * ¿Por qué selects y no <input type="date"> / "datetime-local"?
 * Porque esos inputs se dibujan en el idioma del NAVEGADOR: en un Chrome en
 * inglés salen como mm/dd/yyyy y AM/PM, y la página no puede cambiarlo.
 * Con selects el orden es siempre día / mes / año y la hora en 24 h, en
 * cualquier computadora.
 *
 * Los dos componentes son "controlados": reciben el valor completo como texto
 * ("2026-10-04" y "10:00", o '' si no hay) y avisan con onChange. Si el admin
 * toca una sola parte y las otras están vacías, se rellenan con un valor
 * razonable (hoy, o minuto 00) para que el valor siempre quede completo.
 */

const MESES = [
    'enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio',
    'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre',
];

const dos = (n: number) => String(n).padStart(2, '0');

/** Días que tiene un mes (mes de 1 a 12). El día 0 del mes siguiente es el último de este. */
const diasDelMes = (anio: number, mes: number) => new Date(Date.UTC(anio, mes, 0)).getUTCDate();

export function CampoFecha({
    id,
    valor,
    onChange,
}: {
    id: string;
    /** "2026-10-04" o '' */
    valor: string;
    onChange: (valor: string) => void;
}) {
    const hoy = separarFechaHora(new Date()).fecha;
    const [a, m, d] = (valor || hoy).split('-').map(Number);
    const vacio = !valor;

    // Cambia una parte y recompone el valor. Si el día no existe en el mes
    // nuevo (31 de febrero), se ajusta al último día válido.
    const cambiar = (parte: { anio?: number; mes?: number; dia?: number }) => {
        const anio = parte.anio ?? a;
        const mes = parte.mes ?? m;
        const dia = Math.min(parte.dia ?? d, diasDelMes(anio, mes));
        onChange(`${anio}-${dos(mes)}-${dos(dia)}`);
    };

    const anioActual = Number(hoy.slice(0, 4));
    const anios = [anioActual - 1, anioActual, anioActual + 1, anioActual + 2];
    if (!anios.includes(a)) anios.unshift(a); // un partido viejo de otro año

    // cn() y no un template string: px-2.5 choca con el px-3.5 de claseCampo.
    const select = cn(claseCampo, 'px-2.5');

    return (
        <div className="flex gap-1">
            <select
                id={id}
                aria-label="Día"
                value={vacio ? '' : d}
                onChange={(e) => cambiar({ dia: Number(e.target.value) })}
                className={select}
            >
                {vacio && <option value="">Día</option>}
                {Array.from({ length: diasDelMes(a, m) }, (_, i) => i + 1).map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
            <select
                aria-label="Mes"
                value={vacio ? '' : m}
                onChange={(e) => cambiar({ mes: Number(e.target.value) })}
                className={select}
            >
                {vacio && <option value="">Mes</option>}
                {MESES.map((nombre, i) => (
                    <option key={nombre} value={i + 1}>{nombre}</option>
                ))}
            </select>
            <select
                aria-label="Año"
                value={vacio ? '' : a}
                onChange={(e) => cambiar({ anio: Number(e.target.value) })}
                className={select}
            >
                {vacio && <option value="">Año</option>}
                {anios.map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
        </div>
    );
}

export function CampoHora({
    id,
    valor,
    onChange,
}: {
    id: string;
    /** "10:00" o '' */
    valor: string;
    onChange: (valor: string) => void;
}) {
    const vacio = !valor;
    const [h, min] = (valor || '00:00').split(':');

    // Minutos de 5 en 5. Si un partido guardado trae otro minuto, se agrega
    // para no perderlo al editar.
    const minutos = Array.from({ length: 12 }, (_, i) => dos(i * 5));
    if (!minutos.includes(min)) minutos.push(min);

    const select = cn(claseCampo, 'px-2.5');

    return (
        <div className="flex items-center gap-1">
            <select
                id={id}
                aria-label="Hora"
                value={vacio ? '' : h}
                onChange={(e) => onChange(`${e.target.value}:${min}`)}
                className={select}
            >
                {vacio && <option value="">Hora</option>}
                {Array.from({ length: 24 }, (_, i) => dos(i)).map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
            <span className="text-tenue">:</span>
            <select
                aria-label="Minutos"
                value={vacio ? '' : min}
                onChange={(e) => onChange(`${h}:${e.target.value}`)}
                className={select}
            >
                {vacio && <option value="">Min</option>}
                {minutos.map((n) => (
                    <option key={n} value={n}>{n}</option>
                ))}
            </select>
        </div>
    );
}
