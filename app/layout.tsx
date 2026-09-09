import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { TrpcProvider } from '@/utils/trpc-provider';
import { Toaster } from 'react-hot-toast';
import Footer from '@/components/footer';

const inter = Inter({ subsets: ["latin"] });

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
    <html lang="es">
      <body className={inter.className}>
        <TrpcProvider>
          <div className="flex min-h-screen flex-col">
            <div className="flex-1">
              {children}
            </div>
            <Footer />
            <Toaster />
          </div>
        </TrpcProvider>
      </body>
    </html>
  );
}
