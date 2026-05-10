"use client";

import { useEffect, useState } from "react";
import { auth, db } from "@/firebase/config";
import { collection, query, where, onSnapshot, orderBy } from "firebase/firestore";
import { onAuthStateChanged } from "firebase/auth";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function ListaMensagens() {
  const [conversas, setConversas] = useState<any[]>([]);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (usuarioLogado) => {
      if (usuarioLogado) {
        // Remove o orderBy da query
        const q = query(
          collection(db, "chats"),
          where("participantes", "array-contains", usuarioLogado.uid)
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const lista = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          
          // Ordena localmente com JavaScript
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

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col md:flex-row">
      {/* Menu Lateral */}
      <aside className="w-full md:w-64 bg-slate-900 text-white p-6 shadow-xl">
        <h2 className="text-xl font-bold mb-10 text-orange-500 tracking-tighter">NEXUS DASH</h2>
        <nav className="space-y-4">
          <Link href="/dashboard" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Resumo</Link>
          <Link href="/dashboard/mensagens" className="block px-4 py-2 bg-slate-800 rounded-md font-medium text-orange-400">Mensagens</Link>
          <Link href="/dashboard/perfil" className="block px-4 py-2 hover:bg-slate-800 rounded-md transition text-gray-300">Perfil Empresa</Link>
        </nav>
      </aside>

      <section className="flex-1 p-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-8">Centro de Negociação</h1>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {carregando ? (
            <p className="p-10 text-center text-gray-400">A carregar conversas...</p>
          ) : conversas.length === 0 ? (
            <div className="p-20 text-center">
              <p className="text-gray-500">Ainda não tem conversas ativas.</p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-100">
              {conversas.map((chat) => (
                <li key={chat.id} className="hover:bg-gray-50 transition cursor-pointer">
                  <Link href={`/dashboard/mensagens/${chat.id}`} className="flex p-6 items-center">
                    <div className="h-12 w-12 bg-orange-100 rounded-full flex items-center justify-center text-orange-600 font-bold text-lg">
                      {chat.produto_nome?.charAt(0) || "P"}
                    </div>
                    <div className="ml-4 flex-1">
                      <div className="flex justify-between items-center">
                        <h3 className="font-bold text-slate-900">{chat.produto_nome}</h3>
                        <span className="text-xs text-gray-400">
                          {chat.ultima_mensagem_data?.toDate().toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 truncate mt-1">
                        {chat.ultima_mensagem_texto}
                      </p>
                    </div>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </main>
  );
}