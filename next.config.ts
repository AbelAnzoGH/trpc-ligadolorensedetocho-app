import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 /**
   * sharp carga su biblioteca nativa (libvips) por el enlazador dinámico,
   * no con un require. El rastreador de Next no puede verla, así que hay
   * que incluirla a mano en el paquete de esta ruta.
   */
  outputFileTracingIncludes: {
    '/api/upload': ['./node_modules/@img/**/*'],
  },
};

export default nextConfig;
