"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, deleteDoc, doc } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [cotacoes, setCotacoes] = useState<any[]>([]);
  const [meusProdutos, setMeusProdutos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (usuarioLogado) => {
      if (usuarioLogado) {
        setUser(usuarioLogado);
        await carregarDadosDoPainel(usuarioLogado.uid);
      } else {
        router.push("/login");
      }
      setCarregando(false);
    });
    return () => unsubscribe();
  }, [router]);

  const carregarDadosDoPainel = async (uid: string) => {
    try {
      const qProdutos = query(collection(db, "produtos"), where("vendedor_id", "==", uid));
      const snapProdutos = await getDocs(qProdutos);
      setMeusProdutos(snapProdutos.docs.map(doc => ({ id: doc.id, ...doc.data() })));

      const qCotacoes = query(collection(db, "cotacoes"), where("vendedor_id", "==", uid));
      const snapCotacoes = await getDocs(qCotacoes);
      const listaCotacoes = snapCotacoes.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .sort((a: any, b: any) => b.data_solicitacao.toMillis() - a.data_solicitacao.toMillis());
      setCotacoes(listaCotacoes);
    } catch (erro) {
      console.error(erro);
    }
  };

  const eliminarProduto = async (produtoId: string) => {
    if (confirm("Tem certeza que deseja remover este produto do catálogo?")) {
      try {
        await deleteDoc(doc(db, "produtos", produtoId));
        setMeusProdutos(meusProdutos.filter(p => p.id !== produtoId));
        alert("Produto removido com sucesso.");
      } catch (erro) {
        alert("Erro ao eliminar produto.");
      }
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    router.push("/login");
  };

  if (carregando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">A processar...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Menu Lateral */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-10 text-orange-500 tracking-tighter">NEXUS DASH</h2>
        <nav className="flex-1 space-y-4">
          <Link href="/dashboard" className="block px-4 py-2 bg-slate-800 rounded-md font-medium text-orange-400">Resumo</Link>
          <Link href="/dashboard/perfil" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Perfil Empresa</Link>
        </nav>
        <button onClick={handleLogout} className="mt-10 px-4 py-2 bg-red-900/40 text-red-200 rounded-md hover:bg-red-800 transition text-sm">Sair</button>
      </aside>

      <section className="flex-1 p-8">
        <header className="flex justify-between items-center mb-8 pb-6 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-slate-900">Gestão B2B</h1>
          <Link href="/dashboard/novo-produto" className="px-6 py-2 bg-orange-600 text-white rounded-lg font-medium hover:bg-orange-700 transition shadow-sm">+ Novo Item</Link>
        </header>

        {/* Gestão de Produtos */}
        <div className="mb-12">
          <h2 className="text-lg font-bold text-slate-900 mb-4">O Meu Catálogo ({meusProdutos.length})</h2>
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-slate-50 border-b border-gray-100">
                <tr>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Produto</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Categoria</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase">Preço</th>
                  <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {meusProdutos.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50 transition">
                    <td className="p-4 font-medium text-slate-900">{p.nome}</td>
                    <td className="p-4 text-sm text-gray-500">{p.categoria}</td>
                    <td className="p-4 text-sm font-bold text-slate-700">R$ {p.preco.toFixed(2)}</td>
                    <td className="p-4 text-right">
                      <button onClick={() => eliminarProduto(p.id)} className="text-red-500 hover:text-red-700 text-sm font-medium">Eliminar</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {meusProdutos.length === 0 && <p className="p-8 text-center text-gray-400">Nenhum produto listado.</p>}
          </div>
        </div>

        {/* Leads de Cotação */}
        <div>
          <h2 className="text-lg font-bold text-slate-900 mb-4">Cotações Recebidas</h2>
          <div className="space-y-4">
            {cotacoes.map((c) => (
              <div key={c.id} className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm flex flex-col md:flex-row justify-between gap-4">
                <div className="flex-1">
                  <span className="text-xs font-bold text-green-600 uppercase tracking-widest">{c.nome_produto}</span>
                  <h3 className="font-bold text-slate-900 mt-1">{c.nome_comprador}</h3>
                  <p className="text-sm text-gray-600 mt-2 italic">"{c.mensagem}"</p>
                </div>
                <div className="flex items-center gap-4">
                  <a href={`https://wa.me/55${c.telefone_comprador.replace(/\D/g, '')}`} target="_blank" className="px-4 py-2 bg-green-600 text-white text-sm font-bold rounded hover:bg-green-700 transition">WhatsApp</a>
                </div>
              </div>
            ))}
            {cotacoes.length === 0 && <p className="text-center py-10 text-gray-400">Sem novas cotações.</p>}
          </div>
        </div>
      </section>
    </main>
  );
}