import Link from 'next/link';
import LogoLiga from './logo-liga';
import HeaderNav from './header-nav';
import { getAuthUser } from '@/utils/get-auth-user';

const Header = async () => {
    const user = await getAuthUser({ shouldRedirect: false });

    return (
        <nav className="sticky top-0 z-10 backdrop-filter backdrop-blur-lg bg-opacity-0 border-b border-gray-200">
            <div className="relative max-w-5xl mx-auto px-4">
                <div className="flex items-center justify-between h-16">
                    <div>
                        <Link href='/' className='flex items-center gap-2'>
                            <LogoLiga className='h-8 w-auto shrink-0' title='' />
                            <span className='bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-transparent text-lg sm:text-xl font-bold leading-tight'>
                                LIGADOLORENSEDETOCHO
                            </span>
                        </Link>
                    </div>
                    <HeaderNav user={user} />
                </div>
            </div>
        </nav>
    );
};

export default Header;
