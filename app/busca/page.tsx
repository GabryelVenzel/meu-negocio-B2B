"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { collection, query, where, getDocs, limit, orderBy } from "firebase/firestore";
import Link from "next/link";

export default function PaginaBusca() {
  const [termo, setTermo] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(false);

  // Efeito para busca automática com Debounce
  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      if (termo.length >= 2) {
        executarBusca(termo);
      } else if (termo.length === 0) {
        carregarIniciais();
      }
    }, 500); // Aguarda 500ms após a última tecla digitada

    return () => clearTimeout(delayDebounceFn);
  }, [termo]);

  // Carrega os produtos mais recentes quando a página abre ou a busca limpa
  const carregarIniciais = async () => {
    setCarregando(true);
    try {
      const q = query(collection(db, "produtos"), orderBy("data_cadastro", "desc"), limit(12));
      const snap = await getDocs(q);
      setResultados(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    } catch (error) {
      console.error("Erro ao carregar iniciais:", error);
    } finally {
      setCarregando(false);
    }
  };

  // MÁGICA DA BUSCA DE ALTA PERFORMANCE (USANDO KEYWORDS)
  const executarBusca = async (texto: string) => {
    setCarregando(true);
    // Tratamos o termo igual ao que fizemos no cadastro
    const termoTratado = texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

    try {
      const q = query(
        collection(db, "produtos"),
        where("searchKeywords", "array-contains", termoTratado),
        limit(20)
      );

      const snap = await getDocs(q);
      const docs = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setResultados(docs);
    } catch (error) {
      console.error("Erro na busca:", error);
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      {/* Header de Busca */}
      <section className="bg-slate-900 pt-16 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <Link href="/" className="text-white font-black text-2xl mb-8 inline-block tracking-tighter">
            NEXUS<span className="text-orange-500">B2B</span>
          </Link>
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-8">
            Encontre equipamentos e suprimentos industriais
          </h1>
          
          <div className="relative max-w-2xl mx-auto">
            <input 
              type="text" 
              placeholder="Ex: Andaime, Furadeira, NR12..." 
              value={termo}
              onChange={(e) => setTermo(e.target.value)}
              className="w-full px-6 py-5 rounded-2xl shadow-2xl text-slate-900 text-lg outline-none focus:ring-4 focus:ring-orange-500/30 transition-all"
            />
            {carregando && (
              <div className="absolute right-6 top-5">
                <div className="animate-spin h-6 w-6 border-4 border-orange-500 border-t-transparent rounded-full"></div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Grid de Resultados */}
      <section className="max-w-7xl mx-auto px-6 -mt-12">
        <div className="flex justify-between items-end mb-6 text-slate-900">
          <h2 className="font-bold text-xl">
            {termo.length >= 2 ? `Resultados para "${termo}"` : "Produtos em Destaque"}
          </h2>
          <span className="text-sm text-gray-500">{resultados.length} itens encontrados</span>
        </div>

        {resultados.length === 0 && !carregando ? (
          <div className="bg-white p-20 rounded-3xl shadow-sm text-center border border-dashed border-gray-300">
            <p className="text-gray-400 text-lg">Nenhum produto encontrado com este termo.</p>
            <button onClick={() => setTermo("")} className="mt-4 text-orange-600 font-bold hover:underline">Limpar busca</button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {resultados.map((p) => (
              <Link 
                href={`/produto/${p.id}`} 
                key={p.id} 
                className="bg-white rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all border border-gray-100 group flex flex-col"
              >
                <div className="h-56 bg-gray-50 p-6 flex items-center justify-center relative overflow-hidden">
                  {p.imagemUrl ? (
                    <img src={p.imagemUrl} alt={p.nome} className="h-full w-full object-contain group-hover:scale-110 transition-transform duration-500" />
                  ) : (
                    <span className="text-gray-200 font-bold">SEM IMAGEM</span>
                  )}
                  {p.norma && (
                    <span className="absolute top-3 left-3 bg-slate-900 text-white text-[10px] font-bold px-2 py-1 rounded">
                      {p.norma}
                    </span>
                  )}
                </div>
                
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-black text-orange-600 uppercase tracking-widest mb-1">{p.categoria}</span>
                  <h3 className="font-bold text-slate-900 mb-2 line-clamp-2">{p.nome}</h3>
                  
                  <div className="mt-auto pt-4 border-t border-gray-50">
                    <p className="text-lg font-black text-slate-900">
                      {p.sobConsulta ? "Sob Consulta" : `R$ ${p.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </p>
                    <p className="text-[10px] text-gray-400 font-medium mt-1">Vendido por: {p.vendedor_email}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}