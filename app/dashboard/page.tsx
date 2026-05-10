"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged, signOut, User } from "firebase/auth";
import { collection, query, where, getDocs, orderBy, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const [conversas, setConversas] = useState<any[]>([]);
  const [meusProdutos, setMeusProdutos] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, async (usuarioLogado) => {
      if (usuarioLogado) {
        setUser(usuarioLogado);
        carregarProdutos(usuarioLogado.uid);
        
        // Pede apenas os chats (sem o orderBy do Firebase)
        const qChats = query(
          collection(db, "chats"),
          where("participantes", "array-contains", usuarioLogado.uid)
        );

        const unsubscribeChats = onSnapshot(qChats, (snap) => {
          const lista = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // O TRUQUE: Ordena os dados usando o JavaScript (do mais recente para o mais antigo)
          lista.sort((a, b) => {
            const dataA = a.ultima_mensagem_data?.toMillis() || 0;
            const dataB = b.ultima_mensagem_data?.toMillis() || 0;
            return dataB - dataA;
          });

          setConversas(lista);
          setCarregando(false);
        });

        return () => unsubscribeChats();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  const carregarProdutos = async (uid: string) => {
    const q = query(collection(db, "produtos"), where("vendedor_id", "==", uid));
    const snap = await getDocs(q);
    setMeusProdutos(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
  };

  if (carregando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">A carregar Nexus Dash...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar */}
      <aside className="w-full md:w-64 bg-slate-900 text-white flex flex-col p-6">
        <h2 className="text-xl font-bold mb-10 text-orange-500">NEXUS B2B</h2>
        <nav className="flex-1 space-y-2">
          <Link href="/dashboard" className="block px-4 py-2 bg-slate-800 rounded-md text-orange-400 font-bold">Início</Link>
          <Link href="/dashboard/mensagens" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Mensagens</Link>
          <Link href="/dashboard/perfil" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Perfil</Link>
        </nav>
        <button onClick={() => signOut(auth)} className="mt-10 text-red-400 text-sm hover:underline">Sair do sistema</button>
      </aside>

      {/* Conteúdo */}
      <section className="flex-1 p-8 overflow-y-auto">
        <div className="flex justify-between items-center mb-10">
          <h1 className="text-3xl font-bold text-slate-900">Resumo do Negócio</h1>
          <Link href="/dashboard/novo-produto" className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-orange-500 transition">
            + Novo Produto
          </Link>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Coluna de Mensagens/Negociações */}
          <div className="lg:col-span-2 space-y-6">
            <h3 className="text-lg font-bold text-slate-800 flex items-center">
              <span className="w-2 h-2 bg-orange-500 rounded-full mr-2"></span>
              Negociações Ativas
            </h3>
            
            {conversas.length === 0 ? (
              <div className="bg-white p-10 rounded-xl border border-dashed border-gray-300 text-center text-gray-400">
                Nenhuma conversa iniciada ainda.
              </div>
            ) : (
              <div className="grid gap-4">
                {conversas.map((chat) => (
                  <Link href={`/dashboard/mensagens/${chat.id}`} key={chat.id} className="bg-white p-5 rounded-xl border border-gray-100 shadow-sm hover:shadow-md transition flex items-center group">
                    <div className="h-12 w-12 bg-slate-100 rounded-full flex items-center justify-center text-slate-500 font-bold group-hover:bg-orange-100 group-hover:text-orange-600 transition">
                      {chat.produto_nome?.charAt(0)}
                    </div>
                    <div className="ml-4 flex-1">
                      <h4 className="font-bold text-slate-900">{chat.produto_nome}</h4>
                      <p className="text-sm text-gray-500 truncate max-w-xs">{chat.ultima_mensagem_texto}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 mb-2">
                        {chat.ultima_mensagem_data?.toDate().toLocaleDateString('pt-BR')}
                      </p>
                      <span className="text-xs font-bold text-blue-600">Abrir Chat &rarr;</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Coluna de Inventário Rápido */}
          <div className="space-y-6">
            <h3 className="text-lg font-bold text-slate-800">Meu Catálogo</h3>
            <div className="bg-white rounded-xl border border-gray-100 shadow-sm divide-y divide-gray-50">
              {meusProdutos.slice(0, 5).map((p) => (
                <div key={p.id} className="p-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-slate-700 truncate mr-2">{p.nome}</span>
                  <span className="text-xs font-bold text-slate-400">R$ {p.preco}</span>
                </div>
              ))}
              {meusProdutos.length === 0 && <p className="p-4 text-xs text-gray-400">Sem itens cadastrados.</p>}
              <Link href="/dashboard" className="block p-3 text-center text-xs text-blue-600 font-bold hover:bg-gray-50">Ver todos</Link>
            </div>
          </div>

        </div>
      </section>
    </main>
  );
}