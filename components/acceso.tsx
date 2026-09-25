import type { ReactNode } from 'react';
import LogoLiga from './logo-liga';
import { Pagina } from './ui/pagina';
import Tarjeta from './ui/tarjeta';

/**
 * Esqueleto de las páginas de acceso (/login y /register).
 *
 * Es la ÚNICA excepción a "todo alineado a la izquierda": un formulario
 * corto y solo en la pantalla se lee mejor centrado, en una columna angosta
 * (max-w-md), como en cualquier pantalla de inicio de sesión.
 *
 *   <Acceso titulo="Bienvenido de vuelta" descripcion="…" pie={<>¿No tienes cuenta? …</>}>
 *       <LoginForm />
 *   </Acceso>
 */
export default function Acceso({
    titulo,
    descripcion,
    pie,
    children,
}: {
    titulo: string;
    descripcion: string;
    /** Línea debajo de la tarjeta ("¿No tienes cuenta? Regístrate"). */
    pie?: ReactNode;
    children: ReactNode;
}) {
    return (
        <Pagina className="flex justify-center">
            <div className="w-full max-w-md">
                <div className="mb-8 text-center">
                    <LogoLiga className="mx-auto mb-6 h-12 w-auto" title="" />
                    <h1 className="text-titulo-sm font-semibold text-tinta">{titulo}</h1>
                    <p className="mt-2 text-cuerpo text-tenue">{descripcion}</p>
                </div>

                <Tarjeta variante="panel" className="sm:p-8">
                    {children}
                </Tarjeta>

                {pie && <p className="mt-6 text-center text-meta text-tenue">{pie}</p>}
            </div>
        </Pagina>
    );
}
