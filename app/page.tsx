"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const [termoBusca, setTermoBusca] = useState("");
  const router = useRouter();

  const handleBuscar = (e: React.FormEvent) => {
    e.preventDefault();
    if (termoBusca.trim()) {
      router.push(`/busca?q=${termoBusca}`);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 flex flex-col items-center justify-center relative overflow-hidden">
      
      {/* Círculos decorativos de fundo para dar um ar tecnológico */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-orange-600/20 rounded-full blur-3xl"></div>
      <div className="absolute bottom-[-10%] right-[-10%] w-96 h-96 bg-blue-600/20 rounded-full blur-3xl"></div>

      <div className="max-w-4xl w-full px-6 z-10 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-white mb-6 tracking-tight">
          O Marketplace da <span className="text-orange-500">Indústria</span>
        </h1>
        <p className="text-xl text-gray-300 mb-10 max-w-2xl mx-auto">
          Conecte-se com fornecedores verificados. Encontre materiais, EPIs, maquinário e mão de obra especializada para o seu negócio.
        </p>

        {/* Barra de Busca Principal */}
        <form onSubmit={handleBuscar} className="flex flex-col md:flex-row gap-4 max-w-3xl mx-auto">
          <input 
            type="text" 
            value={termoBusca}
            onChange={(e) => setTermoBusca(e.target.value)}
            placeholder="O que sua obra precisa hoje?"
            // CORREÇÃO AQUI: bg-white agora está dentro da className
            className="flex-1 px-6 py-4 text-lg rounded-xl outline-none bg-white text-slate-900 shadow-2xl focus:ring-4 focus:ring-orange-500/40 transition-all placeholder:text-gray-400"
          />
          <button 
            type="submit"
            className="px-12 py-4 bg-orange-600 text-white text-lg font-black rounded-xl hover:bg-orange-500 transition shadow-xl active:scale-95"
          >
            Buscar Agora
          </button>
        </form>

        {/* Sugestões Rápidas */}
        <div className="mt-12 flex flex-wrap justify-center gap-3 items-center">
          <span className="text-gray-500 text-sm font-bold uppercase tracking-widest">Populares:</span>
          <Link href="/busca?categoria=EPI" className="px-5 py-2 rounded-full border border-slate-700 text-gray-300 hover:bg-slate-800 hover:border-orange-500 transition text-sm font-medium">EPIs</Link>
          <Link href="/busca?categoria=Maquinario" className="px-5 py-2 rounded-full border border-slate-700 text-gray-300 hover:bg-slate-800 hover:border-orange-500 transition text-sm font-medium">Maquinário</Link>
          <Link href="/busca?categoria=Servicos" className="px-5 py-2 rounded-full border border-slate-700 text-gray-300 hover:bg-slate-800 hover:border-orange-500 transition text-sm font-medium">Engenharia</Link>
        </div>
      </div>
    </main>
  );
}