import Header from '@/components/header';
import { Pagina, EncabezadoPagina } from '@/components/ui/pagina';
import JugadoresTabla from './jugadores-tabla';

// Página PÚBLICA: el listado de jugadores de la liga, con filtros.
// La administración vive en /manejar-jugadores.
export default async function JugadoresPage() {
    return (
        <>
            <Header />
            <Pagina>
                <EncabezadoPagina
                    titulo="Jugadores"
                    descripcion="Un registro por jugador, equipo y temporada: quien juega en dos categorías aparece una vez por cada una, con sus estadísticas propias."
                />
                <JugadoresTabla />
            </Pagina>
        </>
    );
}
