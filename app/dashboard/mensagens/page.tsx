"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { onAuthStateChanged } from "firebase/auth";
import { collection, query, where, onSnapshot } from "firebase/firestore";
import { useRouter } from "next/navigation";
import Link from "next/link";

// DEFINIMOS O MOLDE PARA O TYPESCRIPT NÃO RECLAMAR
interface ChatData {
  id: string;
  produto_nome?: string;
  ultima_mensagem_texto?: string;
  ultima_mensagem_data?: any; // Usamos any aqui para o Timestamp do Firebase
  participantes?: string[];
}

export default function ListaMensagens() {
  const [conversas, setConversas] = useState<ChatData[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (user) => {
      if (user) {
        // Busca todos os chats onde o usuário logado participa
        const q = query(
          collection(db, "chats"),
          where("participantes", "array-contains", user.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snap) => {
          // Tipamos a lista explicitamente como ChatData[]
          const lista: ChatData[] = snap.docs.map(doc => ({
            id: doc.id,
            ...doc.data()
          } as ChatData));

          // AQUI ESTAVA O ERRO: Agora o TS sabe que ultima_mensagem_data existe
          lista.sort((a, b) => {
            const dataA = a.ultima_mensagem_data?.toMillis() || 0;
            const dataB = b.ultima_mensagem_data?.toMillis() || 0;
            return dataB - dataA;
          });

          setConversas(lista);
          setCarregando(false);
        });

        return () => unsubscribeSnapshot();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [router]);

  if (carregando) return <div className="p-20 text-center text-gray-500 font-medium">Carregando suas conversas...</div>;

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Sidebar Simples */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6">
        <h2 className="text-xl font-bold mb-10 text-orange-500 tracking-tighter">NEXUS DASH</h2>
        <nav className="space-y-3">
          <Link href="/dashboard" className="block px-4 py-2 hover:bg-slate-800 rounded-md text-gray-300 transition">Visão Geral</Link>
          <Link href="/dashboard/meu-catalogo" className="block px-4 py-2 hover:bg-slate-800 rounded-md text-gray-300 transition">Meu Catálogo</Link>
          <Link href="/dashboard/mensagens" className="block px-4 py-2 bg-slate-800 rounded-md text-orange-400 font-bold">Mensagens</Link>
        </nav>
      </aside>

      {/* Lista de Conversas */}
      <section className="flex-1 p-8 lg:p-12 overflow-y-auto">
        <header className="mb-10">
          <h1 className="text-3xl font-black text-slate-900">Minhas Negociações</h1>
          <p className="text-gray-500">Acompanhe seus orçamentos e conversas com fornecedores.</p>
        </header>

        {conversas.length === 0 ? (
          <div className="bg-white p-20 rounded-2xl border border-dashed border-gray-300 text-center text-gray-400">
            Você ainda não possui conversas ativas.
          </div>
        ) : (
          <div className="grid gap-4 max-w-4xl">
            {conversas.map((chat) => (
              <Link 
                href={`/dashboard/mensagens/${chat.id}`} 
                key={chat.id} 
                className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-orange-200 transition flex items-center group"
              >
                <div className="h-14 w-14 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 font-black text-xl group-hover:bg-orange-100 group-hover:text-orange-600 transition">
                  {chat.produto_nome?.charAt(0) || "?"}
                </div>
                
                <div className="ml-5 flex-1">
                  <h3 className="font-bold text-slate-900 text-lg">{chat.produto_nome}</h3>
                  <p className="text-sm text-gray-500 truncate max-w-md">{chat.ultima_mensagem_texto || "Sem mensagens ainda..."}</p>
                </div>

                <div className="text-right hidden sm:block">
                  <p className="text-xs text-gray-400 mb-2">
                    {chat.ultima_mensagem_data?.toDate().toLocaleDateString('pt-BR')}
                  </p>
                  <span className="text-sm font-bold text-blue-600 group-hover:text-orange-600">Abrir Sala &rarr;</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </main>
  );
}