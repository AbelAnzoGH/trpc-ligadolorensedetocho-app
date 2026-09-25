'use client';

import queryClient from "@/utils/query-client";
import { trpc } from '@/utils/trpc';
import Link from 'next/link';
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast';
import type { RoleEnumType } from '@/app/generated/prisma';

export default function AuthMenu({ role }: { role: RoleEnumType | null }) {
    const router = useRouter();

    const { mutate: logoutFn } = trpc.logoutUser.useMutation({
        onError(error) {
            toast.error(error.message);
            console.log('Error message', error.message);

        },
        onSuccess(){
            queryClient.clear();
            toast.success('logout succesful');
            router.push('/login');
            router.refresh();
        }
    })
    return(
        <>
            {role === 'admin' && (
                <>
                    <li>
                        <Link href='/manejar-equipos' className="text-white font-semibold hover:text-pink-500">
                            Manejar equipos
                        </Link>
                    </li>

                    <li>
                        <Link href='/manejar-jugadores' className="text-white font-semibold hover:text-pink-500">
                            Manejar jugadores
                        </Link>
                    </li>

                    <li>
                        <Link href='/manejar-temporadas' className="text-white font-semibold hover:text-pink-500">
                            Manejar temporadas
                        </Link>
                    </li>

                    <li>
                        <Link href='/manejar-partidos' className="text-white font-semibold hover:text-pink-500">
                            Manejar partidos
                        </Link>
                    </li>
                </>
            )}

            <li className="cursor-pointer text-white font-semibold hover:text-pink-500" onClick={() => logoutFn()}>
                Logout
            </li>
        </>
    )
}
