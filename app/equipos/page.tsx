import Header from '@/components/header';
import { Pagina, EncabezadoPagina } from '@/components/ui/pagina';
import EquiposTabla from './equipos-tabla';

// Página PÚBLICA: cualquiera puede ver los equipos de la liga, con o sin sesión.
// Por eso no llama a getAuthUser: no hay nada que proteger aquí.
// La administración (crear / editar / borrar) vive en /manejar-equipos.
export default async function EquiposPage() {
    return (
        <>
            <Header />
            <Pagina>
                <EncabezadoPagina
                    titulo="Equipos de la liga"
                    descripcion="Los equipos inscritos en cada temporada de nuestras ligas."
                />
                <EquiposTabla />
            </Pagina>
        </>
    );
}
