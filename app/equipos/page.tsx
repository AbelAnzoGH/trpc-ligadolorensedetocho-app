import Header from '@/components/header';
import EquiposTabla from './equipos-tabla';

// Página PÚBLICA: cualquiera puede ver los equipos de la liga, con o sin sesión.
// Por eso no llama a getAuthUser: no hay nada que proteger aquí.
// La administración (crear / editar / borrar) vive en /manejar-equipos.
export default async function EquiposPage() {
    return (
        <>
            <Header />
            <section className="min-h-screen bg-gray-950 pt-12 pb-20">
                <div className="mx-auto max-w-3xl px-4">
                    <h1 className="mb-2 bg-linear-to-r from-pink-500 to-yellow-500 bg-clip-text text-center text-4xl font-bold text-transparent lg:text-5xl">
                        Equipos de la liga
                    </h1>
                    <p className="mb-8 text-center text-gray-400">
                        Todos los equipos registrados en la Liga Dolorense de Tocho.
                    </p>
                    <EquiposTabla />
                </div>
            </section>
        </>
    );
}
