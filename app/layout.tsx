import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Redefinição de Senha Corporativo",
  description: "Portal corporativo de autoatendimento para redefinição segura de senha.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={`${inter.className} min-h-screen overflow-x-hidden`}>
        {/* Fundo de Metal */}
        <div
          className="fixed inset-0 z-0"
          style={{
            backgroundImage: "url('/bg-metal.png')",
            backgroundSize: "cover",
            backgroundPosition: "center",
            backgroundRepeat: "no-repeat",
          }}
        />
        {/* Overlay escuro sutil para contraste */}
        <div className="fixed inset-0 z-0 bg-black/30" />
        <main className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4">
          {children}
        </main>
      </body>
    </html>
  );
}
