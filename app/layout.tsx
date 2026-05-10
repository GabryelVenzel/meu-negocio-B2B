import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Link from "next/link"; // Componente de navegação do Next.js

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Nexus B2B - O Marketplace da Indústria",
  description: "Conectando fornecedores e empresas.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body className={inter.className}>
        {/* Nossa Navbar Global */}
        <nav className="bg-slate-900 text-white p-4 shadow-md sticky top-0 z-50">
          <div className="max-w-6xl mx-auto flex justify-between items-center">
            <Link href="/" className="text-2xl font-bold text-orange-500 tracking-tight">
              NEXUS <span className="text-white font-light">B2B</span>
            </Link>
            <div className="space-x-6">
              <Link href="/" className="hover:text-orange-400 transition">Início</Link>
              <Link href="/dashboard" className="hover:text-orange-400 transition">Meu Painel</Link>
              <Link href="/login" className="bg-orange-600 px-4 py-2 rounded-md hover:bg-orange-500 transition font-medium">
                Entrar / Cadastrar
              </Link>
            </div>
          </div>
        </nav>

        {/* Onde as páginas vão renderizar */}
        {children}
        
      </body>
    </html>
  );
}