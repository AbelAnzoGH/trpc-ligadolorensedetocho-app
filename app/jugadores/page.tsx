import Header from '@/components/header';
import JugadoresTabla from './jugadores-tabla';

// Página PÚBLICA: el listado de jugadores de la liga, con filtros.
// La administración vive en /manejar-jugadores.
export default async function JugadoresPage() {
    return (
        <>
            <Header />
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-6xl px-4">
                    <h1 className="mb-2 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        Jugadores
                    </h1>
                    <p className="mb-8 text-center text-gray-400">
                        Un registro por jugador y equipo: quien juega en dos categorías
                        aparece una vez por cada una, con sus estadísticas propias.
                    </p>
                    <JugadoresTabla />
                </div>
            </section>
        </>
    );
}
