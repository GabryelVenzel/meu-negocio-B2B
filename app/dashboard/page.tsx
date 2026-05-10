"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  
  const [totalProdutos, setTotalProdutos] = useState(0);
  const [totalNegociacoes, setTotalNegociacoes] = useState(0);
  
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (usuarioLogado) => {
      if (usuarioLogado) {
        setUser(usuarioLogado);
        
        const qProdutos = query(collection(db, "produtos"), where("vendedor_id", "==", usuarioLogado.uid));
        const snapProdutos = await getDocs(qProdutos);
        setTotalProdutos(snapProdutos.docs.length);
        
        const qChats = query(
          collection(db, "chats"),
          where("participantes", "array-contains", usuarioLogado.uid)
        );

        const unsubscribeChats = onSnapshot(qChats, (snap) => {
          setTotalNegociacoes(snap.docs.length);
          setCarregando(false);
        });

        return () => unsubscribeChats();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  if (carregando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">Carregando painel Nexus...</div>;

  // A LÓGICA MÁGICA: Se tem produtos, é Vendedor. Se não, é Comprador.
  const isVendedor = totalProdutos > 0;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-10 text-orange-500 tracking-tighter">NEXUS DASH</h2>
        <nav className="flex-1 space-y-3">
          <Link href="/dashboard" className="block px-4 py-3 bg-slate-800 rounded-md text-orange-400 font-bold border-l-4 border-orange-500">Visão Geral</Link>
          
          {/* Menu de Catálogo SÓ aparece para Vendedores */}
          {isVendedor && (
            <Link href="/dashboard/meu-catalogo" className="block px-4 py-3 hover:bg-slate-800 rounded-md transition text-gray-300">Meu Catálogo</Link>
          )}
          
          <Link href="/dashboard/mensagens" className="block px-4 py-3 hover:bg-slate-800 rounded-md transition text-gray-300">
            {isVendedor ? "Caixa de Entrada" : "Minhas Cotações"}
          </Link>
          <Link href="/dashboard/perfil" className="block px-4 py-3 hover:bg-slate-800 rounded-md transition text-gray-300">Perfil Empresa</Link>
        </nav>
        <button onClick={() => signOut(auth)} className="mt-10 px-4 py-2 bg-red-900/30 text-red-300 rounded hover:bg-red-900/50 transition text-sm">Encerrar Sessão</button>
      </aside>

      <section className="flex-1 p-8 lg:p-12 overflow-y-auto">
        
        <header className="flex flex-col md:flex-row justify-between items-start md:items-center mb-12 gap-4">
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Painel de Controle</h1>
            <p className="text-gray-500 mt-1">
              Bem-vindo(a) ao seu centro de operações. Você está no perfil de <strong className="text-slate-800">{isVendedor ? "Fornecedor" : "Comprador"}</strong>.
            </p>
          </div>
          
          {/* O botão fica diferente dependendo do papel do utilizador */}
          <Link href="/dashboard/novo-produto" className={`px-8 py-3 rounded-lg font-bold shadow-lg transition-all ${isVendedor ? 'bg-orange-600 text-white hover:bg-orange-700 shadow-orange-600/20' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>
            {isVendedor ? "+ Publicar Novo Item" : "Começar a Vender B2B"}
          </Link>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          
          {/* KPI de Inventário - Só aparece se for Vendedor */}
          {isVendedor && (
            <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">Catálogo Ativo</h3>
                <div className="h-10 w-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center text-xl">📦</div>
              </div>
              <p className="text-5xl font-black text-slate-900 mb-4">{totalProdutos}</p>
              <Link href="/dashboard/meu-catalogo" className="text-sm font-bold text-blue-600 hover:text-blue-800 flex items-center">
                Gerenciar inventário <span className="ml-2">&rarr;</span>
              </Link>
            </div>
          )}

          {/* KPI de Negociações (Serve para ambos, mas com textos diferentes) */}
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-gray-500 uppercase tracking-widest">
                {isVendedor ? "Orçamentos Recebidos" : "Cotações Abertas"}
              </h3>
              <div className="h-10 w-10 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center text-xl">💬</div>
            </div>
            <p className="text-5xl font-black text-slate-900 mb-4">{totalNegociacoes}</p>
            <Link href="/dashboard/mensagens" className="text-sm font-bold text-orange-600 hover:text-orange-800 flex items-center">
              Acessar sala de chat <span className="ml-2">&rarr;</span>
            </Link>
          </div>

          {/* Banner "Convite" para Compradores que ainda não vendem */}
          {!isVendedor && (
            <div className="lg:col-span-2 bg-gradient-to-r from-orange-500 to-orange-600 p-8 rounded-2xl shadow-sm text-white flex flex-col justify-center">
              <h3 className="text-2xl font-bold mb-2">Transforme o seu estoque em receita!</h3>
              <p className="mb-6 opacity-90 max-w-lg">O Nexus B2B conecta a sua empresa aos maiores compradores da indústria. Comece a anunciar gratuitamente.</p>
              <div>
                <Link href="/dashboard/novo-produto" className="inline-block px-6 py-3 bg-white text-orange-600 font-bold rounded-lg shadow-sm hover:bg-gray-50 transition">
                  Anunciar Meu Primeiro Produto
                </Link>
              </div>
            </div>
          )}

        </div>

        <div className="bg-slate-900 rounded-2xl p-8 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 max-w-2xl">
            <h2 className="text-2xl font-bold mb-2">Configure o seu Perfil B2B</h2>
            <p className="text-gray-400 mb-6">Mantenha os dados do seu CNPJ atualizados. Perfis verificados geram 40% mais confiança em negociações industriais.</p>
            <Link href="/dashboard/perfil" className="inline-block px-6 py-3 bg-white text-slate-900 font-bold rounded-lg hover:bg-gray-100 transition">
              Atualizar Dados da Empresa
            </Link>
          </div>
          <div className="absolute top-0 right-0 -mr-20 -mt-20 w-64 h-64 rounded-full bg-slate-800 blur-3xl opacity-50"></div>
        </div>

      </section>
    </main>
  );
}