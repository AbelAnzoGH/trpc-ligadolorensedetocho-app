'use client';

import { useState } from 'react';
import Link from 'next/link';
import AuthMenu from './auth-menu';
import type { RoleEnumType } from '@/app/generated/prisma';

type HeaderUser = { role: RoleEnumType | null } | null;

export default function HeaderNav({ user }: { user: HeaderUser }) {
    const [open, setOpen] = useState(false);

    return (
        <>
            {/* Botón hamburguesa: visible solo por debajo del breakpoint md */}
            <button
                type="button"
                className="text-white md:hidden"
                aria-label="Abrir menú"
                aria-expanded={open}
                onClick={() => setOpen((prev) => !prev)}
            >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    {open ? (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                    )}
                </svg>
            </button>

            {/* Mismo <ul> para desktop y móvil: `hidden`/`flex` según `open` para móvil,
                `md:flex` fuerza que en desktop siempre se vea, sin importar `open`. */}
            <ul
                className={`${open ? 'flex' : 'hidden'} absolute top-16 left-0 w-full flex-col items-center gap-4 bg-gray-950 p-4
                md:static md:flex md:w-auto md:flex-row md:bg-transparent md:p-0`}
            >
                <li>
                    <Link href='/' className='text-white hover:text-pink-500 font-semibold' onClick={() => setOpen(false)}>
                        Home
                    </Link>
                </li>
                <li>
                    <Link href='/equipos' className='text-white hover:text-pink-500 font-semibold' onClick={() => setOpen(false)}>
                        Equipos
                    </Link>
                </li>
                <li>
                    <Link href='/jugadores' className='text-white hover:text-pink-500 font-semibold' onClick={() => setOpen(false)}>
                        Jugadores
                    </Link>
                </li>
                {/* {!user && (
                    <>
                        <li>
                            <Link href='/register' className='text-white hover:text-pink-500 font-semibold'>
                                Register
                            </Link>
                        </li>
                        <li>
                            <Link href='/login' className='text-white hover:text-pink-500 font-semibold'>
                                Login
                            </Link>
                        </li>
                    </>
                )} */}
                {user && <AuthMenu role={user.role} />}
            </ul>
        </>
    );
}
