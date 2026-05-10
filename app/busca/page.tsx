"use client";

import { useEffect, useState, Suspense } from "react";
import { collection, getDocs } from "firebase/firestore"; 
import { db } from "@/firebase/config";
import { useSearchParams } from "next/navigation";
import Link from "next/link";

interface Produto {
  id: string;
  nome: string;
  categoria: string;
  preco: number;
  imagemUrl?: string;
  vendedor_email?: string;
}

// O Next.js exige que componentes que usem searchParams sejam envolvidos em Suspense
function ResultadosBusca() {
  const searchParams = useSearchParams();
  const termo = searchParams.get("q")?.toLowerCase() || "";
  const categoriaFiltro = searchParams.get("categoria") || "";
  
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const buscarEFiltrarProdutos = async () => {
      setCarregando(true);
      try {
        // Busca todos os produtos ativos (em um app gigante usaríamos paginação)
        const querySnapshot = await getDocs(collection(db, "produtos"));
        let lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Produto));

        // Aplica os filtros localmente
        if (termo) {
          lista = lista.filter(p => p.nome.toLowerCase().includes(termo));
        }
        if (categoriaFiltro) {
          lista = lista.filter(p => p.categoria === categoriaFiltro);
        }

        setProdutos(lista);
      } catch (erro) {
        console.error("Erro ao buscar", erro);
      } finally {
        setCarregando(false);
      }
    };

    buscarEFiltrarProdutos();
  }, [termo, categoriaFiltro]);

  return (
    <div className="max-w-6xl mx-auto p-8 min-h-screen">
      <div className="mb-8 border-b pb-4">
        <h1 className="text-2xl font-bold text-slate-900">
          Resultados para: <span className="text-orange-600">{termo || categoriaFiltro || "Todos os produtos"}</span>
        </h1>
        <p className="text-gray-500 mt-1">{produtos.length} {produtos.length === 1 ? 'produto encontrado' : 'produtos encontrados'}</p>
      </div>

      {carregando ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1,2,3].map(i => <div key={i} className="h-64 bg-gray-200 animate-pulse rounded-xl"></div>)}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {produtos.map((produto) => (
            <Link href={`/produto/${produto.id}`} key={produto.id} className="group flex flex-col bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <div className="h-48 bg-gray-100 overflow-hidden relative">
                {produto.imagemUrl ? (
                  <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-cover group-hover:scale-105 transition duration-300" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-gray-400">Sem imagem</div>
                )}
                <span className="absolute top-2 left-2 bg-slate-900/80 text-white text-xs px-2 py-1 rounded backdrop-blur-sm">
                  {produto.categoria}
                </span>
              </div>
              <div className="p-4 flex flex-col flex-1">
                <h3 className="text-sm font-bold text-slate-900 line-clamp-2 mb-2">{produto.nome}</h3>
                <div className="mt-auto">
                  <span className="text-xl font-bold text-slate-900">R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {!carregando && produtos.length === 0 && (
        <div className="text-center py-20">
          <p className="text-gray-500 text-lg">Nenhum produto encontado com estes filtros.</p>
          <Link href="/busca" className="mt-4 inline-block text-orange-600 font-medium hover:underline">
            Limpar filtros e ver tudo
          </Link>
        </div>
      )}
    </div>
  );
}

export default function BuscaPage() {
  return (
    <main className="bg-gray-50">
      <Suspense fallback={<div className="p-20 text-center text-gray-500">Iniciando busca...</div>}>
        <ResultadosBusca />
      </Suspense>
    </main>
  );
}