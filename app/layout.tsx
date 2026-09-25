import type { Metadata } from "next";
import { DM_Sans } from "next/font/google";
import "./globals.css";
import { TrpcProvider } from '@/utils/trpc-provider';
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/footer';

// DM Sans es el sustituto gratuito de Cosmica (la fuente de la referencia).
// Es variable: un solo archivo trae todos los pesos, del 100 al 1000.
// `variable` crea la variable CSS --font-dm-sans, que globals.css usa en
// --font-sans. Así Tailwind la aplica a todo el sitio sin poner clases.
const dmSans = DM_Sans({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-dm-sans",
});

export const metadata: Metadata = {
  title: "LigaDolorensedeTocho",
  description: "Equipos, jugadores y estadísticas de la LigaDolorensedeTocho.",
  icons: {
    icon: "/logo-liga.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={dmSans.variable}>
      <body className="font-sans text-cuerpo">
        <TrpcProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
            {/* react-hot-toast trae avisos blancos por defecto; aquí se
                visten con los tokens para que no brillen sobre el fondo oscuro. */}
            <Toaster
              toastOptions={{
                style: {
                  background: 'var(--color-superficie)',
                  color: 'var(--color-tinta)',
                  border: '1px solid var(--color-borde)',
                  borderRadius: 'var(--radius-control)',
                  fontSize: 'var(--text-meta)',
                },
                success: { iconTheme: { primary: 'var(--color-verde-claro)', secondary: 'var(--color-canvas)' } },
                error: { iconTheme: { primary: 'var(--color-rojo-claro)', secondary: 'var(--color-canvas)' } },
              }}
            />
          </div>
        </TrpcProvider>
      </body>
    </html>
  );
}
