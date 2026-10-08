// Datos MOCK para probar la app EN LOCAL: ligas, temporadas, equipos,
// jugadores, sedes y partidos inventados.
//
//   node scripts/seed-mock.mjs           → crea los datos (se puede repetir: no duplica)
//   node scripts/seed-mock.mjs --reset   → borra SOLO lo que creó este script
//   node scripts/seed-mock.mjs --dry     → arma el plan y lo resume, sin tocar la base
//
// Seguridad: se niega a correr si DATABASE_URL no apunta a localhost, y
// también si DIRECT_URL está puesta (esa es la cadena de Neon/producción).
//
// Cómo se distingue lo mock de lo real:
//   - ligas: slug que empieza con "mock-"
//   - equipos: nombre que termina en " (mock)"
//   - sedes: nombre que empieza con "Campo Mock"
//   - jugadores: apellido que termina en " (mock)"
// Todo lo demás (temporadas, inscripciones, membresías, partidos) cuelga de
// esas ligas y equipos. Tus datos reales no se tocan.
//
// Las fechas son RELATIVAS a hoy, para que "la última jornada jugada" de la
// portada siempre tenga algo que mostrar. Si pasan días, corre --reset y
// luego el seed otra vez para refrescarlas.

import 'dotenv/config';
import { PrismaPg } from '@prisma/adapter-pg';
import prismaPkg from '../app/generated/prisma/index.js';

const { PrismaClient } = prismaPkg;

const args = new Set(process.argv.slice(2));
const DRY = args.has('--dry');
const RESET = args.has('--reset');

// ---------------------------------------------------------------------------
// GUARDIA: solo localhost
// ---------------------------------------------------------------------------
if (!DRY) {
    const url = process.env.DATABASE_URL ?? '';
    let host = '';
    try {
        host = new URL(url).hostname;
    } catch {
        /* host queda vacío y abajo se rechaza */
    }
    if (!['localhost', '127.0.0.1', '::1', '[::1]'].includes(host)) {
        console.error(`✗ DATABASE_URL apunta a "${host || 'nada válido'}", no a localhost. No hago nada.`);
        process.exit(1);
    }
    if (process.env.DIRECT_URL) {
        console.error('✗ Hay una DIRECT_URL en el entorno (¿la de Neon?). Quítala (Remove-Item Env:DIRECT_URL) y reintenta.');
        process.exit(1);
    }
}

// ---------------------------------------------------------------------------
// PRNG con semilla fija: mismos datos cada vez que se corre
// ---------------------------------------------------------------------------
let estado = 20261008;
const azar = () => {
    estado = (estado * 1664525 + 1013904223) % 4294967296;
    return estado / 4294967296;
};
const entero = (min, max) => min + Math.floor(azar() * (max - min + 1));
const elegir = (lista) => lista[Math.floor(azar() * lista.length)];

// ---------------------------------------------------------------------------
// MATERIA PRIMA
// ---------------------------------------------------------------------------
const NOMBRES_EQUIPO = [
    'Halcones', 'Toros Bravos', 'Insurgentes', 'Águilas Doradas', 'Lobos del Norte', 'Jaguares',
    'Cóndores', 'Tiburones', 'Panteras', 'Mineros', 'Gladiadores', 'Vaqueros', 'Relámpagos', 'Coyotes',
].map((n) => `${n} (mock)`);

const NOMBRES = ['Luis', 'Carlos', 'Miguel', 'Diego', 'Jorge', 'Iván', 'Daniel', 'Mauricio', 'Raúl', 'Andrés', 'Emilio', 'Sergio',
    'Ana', 'María', 'Sofía', 'Valeria', 'Camila', 'Daniela', 'Fernanda', 'Paola', 'Regina', 'Ximena', 'Renata', 'Lucía'];
const APELLIDOS = ['Hernández', 'García', 'Martínez', 'López', 'González', 'Rodríguez', 'Pérez', 'Sánchez', 'Ramírez', 'Torres',
    'Flores', 'Rivera', 'Gómez', 'Díaz', 'Cruz', 'Morales', 'Ortiz', 'Gutiérrez', 'Chávez', 'Ramos'];
const POSICIONES = ['QB', 'C', 'WR', 'RB', 'FL', 'RU', 'LB', 'CB', 'S', 'DB'];

const SEDES = [
    { name: 'Campo Mock Unidad Deportiva', address: 'Av. Hidalgo s/n, Dolores Hidalgo, Gto.' },
    { name: 'Campo Mock Parque Insurgentes', address: 'Calle Guanajuato 12, Dolores Hidalgo, Gto.' },
];

const equipo = (i) => NOMBRES_EQUIPO[i - 1]; // equipo(1) … equipo(14)
const lista = (...ids) => ids.map(equipo);

// Cada temporada: qué categorías, qué equipos en cada una, y cuántos días
// atrás cayó su última jornada jugada (`ultima`). `todosPendientes` deja la
// jornada más reciente SIN marcadores (para probar que aparece aunque no
// esté finalizada).
const LIGAS = [
    {
        name: 'Liga Mock Norte', slug: 'mock-norte',
        temporadas: [
            {
                number: 1, status: 'cerrada', categorias: ['varonil_libre'], rondasJugadas: 'todas', ultimaHaceDias: 120,
                inscripciones: { varonil_libre: lista(1, 2, 3, 4) },
            },
            {
                number: 2, status: 'activa', rondasJugadas: 3, ultimaHaceDias: 1,
                categorias: ['varonil_libre', 'femenil_libre', 'mixto'],
                inscripciones: {
                    varonil_libre: lista(1, 2, 3, 4, 5, 6),
                    femenil_libre: lista(7, 8, 9, 10),
                    mixto: lista(1, 2, 7, 8),
                },
            },
        ],
    },
    {
        name: 'Liga Mock Sur', slug: 'mock-sur',
        temporadas: [
            {
                number: 1, status: 'activa', rondasJugadas: 2, ultimaHaceDias: 2, todosPendientes: true,
                categorias: ['varonil_libre', 'femenil_libre'],
                inscripciones: {
                    varonil_libre: lista(3, 4, 5, 6, 11, 12),
                    femenil_libre: lista(7, 9, 10, 13),
                },
            },
        ],
    },
    {
        name: 'Liga Mock Centro', slug: 'mock-centro',
        temporadas: [
            // En inscripciones: tiene equipos pero ningún partido.
            {
                number: 1, status: 'inscripciones', rondasJugadas: 0,
                categorias: ['mixto'],
                inscripciones: { mixto: lista(11, 12, 13, 14) },
            },
        ],
    },
];

// ---------------------------------------------------------------------------
// PLAN (puro: no toca la base)
// ---------------------------------------------------------------------------

/** Método del círculo: n equipos (n par) → n-1 jornadas de n/2 partidos. */
const roundRobin = (equipos) => {
    const lista = [...equipos];
    const n = lista.length;
    const rondas = [];
    for (let r = 0; r < n - 1; r++) {
        const partidos = [];
        for (let i = 0; i < n / 2; i++) {
            const a = lista[i];
            const b = lista[n - 1 - i];
            // Alterna localía para que no siempre sea el mismo.
            partidos.push((r + i) % 2 === 0 ? [a, b] : [b, a]);
        }
        rondas.push(partidos);
        lista.splice(1, 0, lista.pop()); // rota todos menos el primero
    }
    return rondas;
};

const MS_DIA = 24 * 60 * 60 * 1000;

/** Marcador de tocho: múltiplos de 6 más algún extra, entre 0 y ~50. */
const puntos = () => 6 * entero(0, 7) + elegir([0, 0, 1, 2]);

const construirPlan = () => {
    const ahora = Date.now();
    const plan = [];

    for (const liga of LIGAS) {
        for (const t of liga.temporadas) {
            const partidos = [];
            const sedeIdx = (c) => c % SEDES.length;

            Object.entries(t.inscripciones).forEach(([categoria, equipos], c) => {
                const rondas = t.rondasJugadas === 0 ? [] : roundRobin(equipos);
                const jugadas = t.rondasJugadas === 'todas' ? rondas.length : t.rondasJugadas;

                rondas.forEach((juegos, r) => {
                    const numero = r + 1;
                    // Jornada `jugadas` cae hace `ultimaHaceDias`; las anteriores, de 7 en 7 días hacia atrás;
                    // las siguientes, hacia adelante.
                    const dia = new Date(ahora - (t.ultimaHaceDias ?? 0) * MS_DIA + (numero - jugadas) * 7 * MS_DIA);
                    juegos.forEach(([local, visitante], i) => {
                        const fecha = new Date(dia);
                        // Horas escalonadas en hora de la liga (UTC-6): 9:00, 10:30, 12:00…
                        // 9:00 locales = 15:00 UTC; después se suman los minutos de cada partido.
                        fecha.setUTCHours(15, 0, 0, 0);
                        fecha.setTime(fecha.getTime() + (i * 90 + c * 30) * 60_000);

                        const pasada = numero <= jugadas;
                        const esUltima = numero === jugadas;
                        // En la jornada más reciente, la mitad queda sin capturar (o todos, si `todosPendientes`).
                        const sinCapturar = t.status !== 'cerrada' && esUltima && (t.todosPendientes || i % 2 === 1);
                        const finalizado = pasada && !sinCapturar;

                        let homeScore = null;
                        let awayScore = null;
                        let isForfeit = false;
                        if (finalizado) {
                            const indice = partidos.length;
                            if (indice % 9 === 4) {
                                // Default: el que no llegó queda en 0 y el otro en 36.
                                isForfeit = true;
                                [homeScore, awayScore] = indice % 2 === 0 ? [36, 0] : [0, 36];
                            } else if (indice % 6 === 2) {
                                homeScore = awayScore = puntos(); // empate
                            } else {
                                homeScore = puntos();
                                awayScore = puntos();
                            }
                        }

                        partidos.push({
                            categoria, local, visitante,
                            round: numero,
                            status: finalizado ? 'finalizado' : 'programado',
                            scheduledAt: fecha,
                            sede: sedeIdx(c + i),
                            field: (i % 3) + 1,
                            homeScore, awayScore, isForfeit,
                            notes: isForfeit ? 'Default: el equipo no se presentó (mock)' : null,
                        });
                    });
                });
            });

            // Un amistoso sin jornada en cada temporada con partidos, para probar el grupo "por fase".
            if (partidos.length > 0 && t.status !== 'cerrada') {
                const [categoria, equipos] = Object.entries(t.inscripciones)[0];
                partidos.push({
                    categoria, local: equipos[0], visitante: equipos[1],
                    round: null, phase: 'amistoso', status: 'finalizado',
                    scheduledAt: new Date(ahora - 30 * MS_DIA), sede: 0, field: 1,
                    homeScore: 12, awayScore: 6, isForfeit: false, notes: 'Amistoso de pretemporada (mock)',
                });
            }

            plan.push({ liga, temporada: t, partidos });
        }
    }
    return plan;
};

/** Jugadores de una inscripción: 8, con números únicos. */
const construirPlantel = (nombreEquipo, categoria, reutilizables) => {
    const femenil = categoria.startsWith('femenil');
    const mixto = categoria.startsWith('mixto');
    const usados = new Set();
    const plantel = [];

    // Hasta 1 jugador que ya existe en otra temporada (la misma persona en otra liga).
    const prestado = reutilizables?.shift();
    if (prestado) {
        usados.add(prestado.jersey);
        plantel.push({ reutilizar: prestado.key, jerseyNumber: prestado.jersey, positions: [elegir(POSICIONES)] });
    }

    while (plantel.length < 8) {
        let jersey = entero(1, 99);
        while (usados.has(jersey)) jersey = entero(1, 99);
        usados.add(jersey);

        const nombre = femenil || (mixto && plantel.length % 2 === 0)
            ? elegir(NOMBRES.slice(12))
            : elegir(NOMBRES.slice(0, 12));
        const apellido = `${elegir(APELLIDOS)} ${elegir(APELLIDOS)} (mock)`;
        const posiciones = azar() < 0.35 ? [elegir(POSICIONES), elegir(POSICIONES)] : [elegir(POSICIONES)];

        plantel.push({
            key: `${nombreEquipo}|${categoria}|${plantel.length}`,
            name: nombre, lastName: apellido,
            age: categoria.endsWith('u16') ? entero(13, 15) : entero(17, 36),
            height: entero(femenil ? 150 : 160, femenil ? 178 : 195),
            jerseyNumber: jersey,
            positions: [...new Set(posiciones)],
            availableForPlayoffs: azar() < 0.9,
        });
    }
    return plantel;
};

// ---------------------------------------------------------------------------
// DRY
// ---------------------------------------------------------------------------
const plan = construirPlan();

if (DRY) {
    let ts = 0, ps = 0;
    for (const { liga, temporada, partidos } of plan) {
        const inscr = Object.values(temporada.inscripciones).reduce((n, e) => n + e.length, 0);
        ts += inscr; ps += partidos.length;
        const fin = partidos.filter((p) => p.status === 'finalizado').length;
        console.log(`${liga.name} #${temporada.number} [${temporada.status}] → ${inscr} inscripciones, ${partidos.length} partidos (${fin} finalizados)`);
    }
    console.log(`Total: ${ts} inscripciones, ${ps} partidos, ${ts * 8} membresías, ${SEDES.length} sedes, ${NOMBRES_EQUIPO.length} equipos.`);
    process.exit(0);
}

// ---------------------------------------------------------------------------
// BASE DE DATOS
// ---------------------------------------------------------------------------
const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }) });

const borrarMock = async () => {
    // Orden inverso a las llaves foráneas (todas son Restrict).
    const ligas = await prisma.league.findMany({ where: { slug: { startsWith: 'mock-' } }, select: { id: true } });
    const ligaIds = ligas.map((l) => l.id);
    const temporadas = await prisma.season.findMany({ where: { leagueId: { in: ligaIds } }, select: { id: true } });
    const tempIds = temporadas.map((s) => s.id);

    const games = await prisma.game.deleteMany({ where: { seasonId: { in: tempIds } } });
    const mems = await prisma.teamMembership.deleteMany({ where: { teamSeason: { seasonId: { in: tempIds } } } });
    const insc = await prisma.teamSeason.deleteMany({ where: { seasonId: { in: tempIds } } });
    const seas = await prisma.season.deleteMany({ where: { id: { in: tempIds } } });
    const lgs = await prisma.league.deleteMany({ where: { id: { in: ligaIds } } });
    // Jugadores mock que ya no juegan en ningún lado (Player→membresías es Cascade al revés, así que se borran aparte).
    const jug = await prisma.player.deleteMany({ where: { lastName: { endsWith: '(mock)' }, memberships: { none: {} } } });
    // Equipos y sedes mock, solo si ya no tienen inscripciones / partidos de OTRAS temporadas.
    const eq = await prisma.team.deleteMany({ where: { name: { endsWith: '(mock)' }, teamSeasons: { none: {} } } });
    const sed = await prisma.venue.deleteMany({ where: { name: { startsWith: 'Campo Mock' }, games: { none: {} } } });

    console.log(`Borrado: ${games.count} partidos, ${mems.count} membresías, ${insc.count} inscripciones, ${seas.count} temporadas, ${lgs.count} ligas, ${jug.count} jugadores, ${eq.count} equipos, ${sed.count} sedes.`);
};

try {
    if (RESET) {
        await borrarMock();
        process.exit(0);
    }

    // Idempotencia: si ya hay ligas mock, no se duplica nada.
    if ((await prisma.league.count({ where: { slug: { startsWith: 'mock-' } } })) > 0) {
        console.log('Ya existen datos mock. Corre con --reset para rehacerlos (por ejemplo, para refrescar las fechas).');
        process.exit(0);
    }

    // Sedes y equipos
    const sedes = [];
    for (const s of SEDES) {
        sedes.push(await prisma.venue.upsert({ where: { name: s.name }, update: {}, create: s }));
    }
    const equipos = new Map();
    for (const name of NOMBRES_EQUIPO) {
        equipos.set(name, await prisma.team.upsert({ where: { name }, update: {}, create: { name } }));
    }

    // Jugadores ya creados por (equipo|categoría|posición): para reutilizarlos en otra liga.
    const jugadoresPorClave = new Map();
    // Jugadores del varonil de Norte #2 disponibles para "prestar" a Sur #1.
    const prestables = [];

    let totales = { ligas: 0, temporadas: 0, inscripciones: 0, jugadores: 0, partidos: 0 };

    for (const { liga, temporada: t, partidos } of plan) {
        const ligaDb = await prisma.league.upsert({
            where: { slug: liga.slug }, update: {}, create: { name: liga.name, slug: liga.slug },
        });
        const season = await prisma.season.create({
            data: { leagueId: ligaDb.id, number: t.number, status: t.status, categories: t.categorias },
        });
        totales.temporadas++;

        const inscritos = new Map(); // `${equipo}|${categoria}` → TeamSeason

        for (const [categoria, nombres] of Object.entries(t.inscripciones)) {
            for (const nombre of nombres) {
                const ts = await prisma.teamSeason.create({
                    data: { seasonId: season.id, teamId: equipos.get(nombre).id, category: categoria },
                });
                inscritos.set(`${nombre}|${categoria}`, ts);
                totales.inscripciones++;

                // Plantel
                const esSur = liga.slug === 'mock-sur' && categoria === 'varonil_libre';
                const plantel = construirPlantel(nombre, categoria, esSur && prestables.length ? [prestables.shift()] : undefined);
                for (const j of plantel) {
                    let playerId;
                    if (j.reutilizar) {
                        playerId = jugadoresPorClave.get(j.reutilizar).id;
                    } else {
                        const p = await prisma.player.create({
                            data: { name: j.name, lastName: j.lastName, age: j.age, height: j.height },
                        });
                        jugadoresPorClave.set(j.key, p);
                        playerId = p.id;
                        totales.jugadores++;
                        if (liga.slug === 'mock-norte' && t.number === 2 && categoria === 'varonil_libre' && prestables.length < 4) {
                            // Jersey alto para no chocar con los del equipo que lo reciba.
                            prestables.push({ key: j.key, jersey: 90 + prestables.length });
                        }
                    }
                    await prisma.teamMembership.create({
                        data: {
                            playerId, teamSeasonId: ts.id,
                            jerseyNumber: j.jerseyNumber,
                            positions: j.positions,
                            availableForPlayoffs: j.availableForPlayoffs ?? true,
                            // Estadísticas ficticias, solo en temporadas con partidos.
                            ...(partidos.length > 0 && {
                                touchdowns: entero(0, 9), interceptions: entero(0, 4),
                                touchdownPasses: entero(0, 6), safeties: entero(0, 1),
                                gamesPlayed: entero(1, 5),
                            }),
                        },
                    });
                }
            }
        }

        // Partidos
        for (const p of partidos) {
            await prisma.game.create({
                data: {
                    seasonId: season.id,
                    homeTeamSeasonId: inscritos.get(`${p.local}|${p.categoria}`).id,
                    awayTeamSeasonId: inscritos.get(`${p.visitante}|${p.categoria}`).id,
                    phase: p.phase ?? 'regular',
                    round: p.round,
                    status: p.status,
                    scheduledAt: p.scheduledAt,
                    venueId: sedes[p.sede].id,
                    field: p.field,
                    homeScore: p.homeScore,
                    awayScore: p.awayScore,
                    isForfeit: p.isForfeit,
                    notes: p.notes,
                },
            });
            totales.partidos++;
        }
    }

    totales.ligas = LIGAS.length;
    console.log('✓ Datos mock creados:', totales);
} finally {
    await prisma.$disconnect();
}
