import Link from 'next/link';
import LogoLiga from './logo-liga';

const Footer = () => {
    const anio = new Date().getFullYear();

    return (
        <footer className="border-t border-gray-800 bg-gray-950">
            <div className="mx-auto max-w-5xl px-4 py-10">
                <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start sm:justify-between">
                    <div className="flex items-center gap-3">
                        <LogoLiga className="h-12 w-auto" title="" />
                        <div>
                            <p className="bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text font-bold text-transparent">
                                LIGADOLORENSE DE TOCHO
                            </p>
                            <p className="text-sm text-gray-500">Tocho bandera</p>
                        </div>
                    </div>

                    <nav aria-label="Enlaces del pie de página">
                        <ul className="flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm">
                            <li>
                                <Link href="/" className="text-gray-400 hover:text-pink-500">
                                    Inicio
                                </Link>
                            </li>
                            <li>
                                <Link href="/equipos" className="text-gray-400 hover:text-pink-500">
                                    Equipos
                                </Link>
                            </li>
                            <li>
                                <Link href="/jugadores" className="text-gray-400 hover:text-pink-500">
                                    Jugadores
                                </Link>
                            </li>
                        </ul>
                    </nav>
                </div>

                <p className="mt-8 text-center text-xs text-gray-600">
                    © {anio} Ligadolorense de Tocho. Todos los derechos reservados.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
