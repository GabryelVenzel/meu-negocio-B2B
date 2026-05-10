"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function MeuCatalogo() {
  const [produtos, setProdutos] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (user) {
        const q = query(collection(db, "produtos"), where("vendedor_id", "==", user.uid));
        const querySnapshot = await getDocs(q);
        const lista = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
        setProdutos(lista);
        setCarregando(false);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [router]);

  const excluirProduto = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este item do catálogo definitivamente?")) {
      await deleteDoc(doc(db, "produtos", id));
      setProdutos(produtos.filter(p => p.id !== id));
    }
  };

  if (carregando) return <div className="p-20 text-center text-gray-500">A carregar o seu catálogo...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Menu Lateral */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-10 text-orange-500 tracking-tighter">NEXUS DASH</h2>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Resumo</Link>
          <Link href="/dashboard/meu-catalogo" className="block px-4 py-2 bg-slate-800 rounded-md font-medium text-orange-400">Meu Catálogo</Link>
          <Link href="/dashboard/mensagens" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Mensagens</Link>
          <Link href="/dashboard/perfil" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Perfil Empresa</Link>
        </nav>
      </aside>

      {/* Área Principal */}
      <section className="flex-1 p-8">
        <header className="flex justify-between items-center mb-10">
          <div>
            <h1 className="text-3xl font-bold text-slate-900">Meu Catálogo de Produtos</h1>
            <p className="text-gray-500 mt-1">Gerencie a visibilidade e os detalhes técnicos dos seus itens.</p>
          </div>
          <Link href="/dashboard/novo-produto" className="bg-orange-600 text-white px-6 py-3 rounded-lg font-bold shadow-lg hover:bg-orange-700 transition">
            + Adicionar Novo
          </Link>
        </header>

        {produtos.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl border border-dashed border-gray-300 text-center">
            <p className="text-gray-400 mb-4">Ainda não tem produtos cadastrados no seu inventário.</p>
            <Link href="/dashboard/novo-produto" className="text-orange-600 font-bold hover:underline">Cadastrar o primeiro item &rarr;</Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {produtos.map((p) => (
              <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex flex-col group hover:shadow-xl transition-shadow duration-300">
                {/* Imagem do Produto */}
                <div className="relative h-48 bg-gray-50 flex items-center justify-center p-4">
                  {p.imagemUrl ? (
                    <img src={p.imagemUrl} alt={p.nome} className="h-full w-full object-contain" />
                  ) : (
                    <span className="text-gray-300 text-xs uppercase font-bold">Sem imagem</span>
                  )}
                  {p.norma && (
                    <span className="absolute top-3 left-3 bg-slate-900/80 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm">
                      {p.norma}
                    </span>
                  )}
                </div>

                {/* Info do Produto */}
                <div className="p-5 flex-1 flex flex-col">
                  <span className="text-[10px] font-bold text-orange-600 uppercase tracking-widest mb-1">{p.categoria}</span>
                  <h3 className="font-bold text-slate-900 mb-2 truncate" title={p.nome}>{p.nome}</h3>
                  <div className="mt-auto">
                    <p className="text-xl font-black text-slate-900">
                      {p.sobConsulta ? "Sob Consulta" : `R$ ${p.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`}
                    </p>
                  </div>
                </div>

                {/* Botões de Ação */}
                <div className="p-4 bg-gray-50 border-t border-gray-100 grid grid-cols-2 gap-2">
                  <Link 
                    href={`/dashboard/editar-produto/${p.id}`} 
                    className="flex items-center justify-center py-2 bg-white border border-gray-200 rounded-md text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    ✏️ Editar
                  </Link>
                  <button 
                    onClick={() => excluirProduto(p.id)}
                    className="flex items-center justify-center py-2 bg-white border border-red-100 rounded-md text-xs font-bold text-red-500 hover:bg-red-50 transition"
                  >
                    🗑️ Excluir
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}