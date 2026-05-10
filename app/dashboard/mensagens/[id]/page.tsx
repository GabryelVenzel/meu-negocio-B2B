"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/firebase/config";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";

export default function ChatRoom() {
  const { id } = useParams();
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [carregando, setCarregando] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    // Espera o Firebase confirmar a autenticação para evitar o bug do F5
    const unsubscribeAuth = onAuthStateChanged(auth, (usuarioLogado) => {
      if (usuarioLogado) {
        setUser(usuarioLogado);
        
        // Carrega as mensagens ordenadas pela data
        const q = query(
          collection(db, "chats", id as string, "mensagens"),
          orderBy("data", "asc")
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMensagens(msgs);
          setCarregando(false);
          // Rola a tela para a última mensagem automaticamente
          setTimeout(() => scrollRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        });

        return () => unsubscribeSnapshot();
      } else {
        router.push("/login");
      }
    });

    return () => unsubscribeAuth();
  }, [id, router]);

  const enviarMensagem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!novaMensagem.trim() || !user) return;

    const texto = novaMensagem;
    setNovaMensagem("");

    try {
      // 1. Salva a mensagem
      await addDoc(collection(db, "chats", id as string, "mensagens"), {
        texto,
        autor_id: user.uid,
        autor_email: user.email,
        data: serverTimestamp()
      });

      // 2. Atualiza o resumo do chat principal
      await updateDoc(doc(db, "chats", id as string), {
        ultima_mensagem_texto: texto,
        ultima_mensagem_data: serverTimestamp()
      });
    } catch (erro) {
      console.error(erro);
    }
  };

  if (carregando) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Conectando à sala segura...</div>;

  return (
    <main className="h-screen bg-white flex flex-col">
      <header className="p-4 border-b bg-slate-900 text-white flex justify-between items-center shadow-md">
        <button onClick={() => router.back()} className="text-gray-400 hover:text-white font-medium">&larr; Voltar</button>
        <h1 className="font-bold text-orange-500 tracking-wider hidden md:block">Negociação Nexus</h1>
        
        {/* BOTÃO DE ORÇAMENTO (Redireciona para a folha A4) */}
        <button 
          onClick={() => router.push(`/dashboard/mensagens/${id}/orcamento`)}
          className="flex items-center bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm font-bold transition border border-slate-700"
        >
          📄 Gerar Orçamento (PDF)
        </button>
      </header>

      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {mensagens.map((m) => (
          <div 
            key={m.id} 
            className={`flex ${m.autor_id === user?.uid ? 'justify-end' : 'justify-start'}`}
          >
            <div className={`max-w-xs md:max-w-md p-4 rounded-2xl shadow-sm ${
              m.autor_id === user?.uid 
                ? 'bg-slate-900 text-white rounded-br-none' 
                : 'bg-white border border-gray-200 text-slate-800 rounded-bl-none'
            }`}>
              <p className={`text-xs font-bold mb-1 ${m.autor_id === user?.uid ? 'text-orange-400' : 'text-gray-400'}`}>
                {m.autor_id === user?.uid ? 'Eu' : m.autor_email}
              </p>
              <p className="text-sm md:text-base leading-relaxed">{m.texto}</p>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      <form onSubmit={enviarMensagem} className="p-4 border-t bg-white flex gap-4 shadow-inner">
        <input 
          type="text" 
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Escreva a sua proposta ou dúvida..."
          className="flex-1 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
        />
        <button type="submit" disabled={!novaMensagem.trim()} className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 disabled:cursor-not-allowed">
          Enviar
        </button>
      </form>
    </main>
  );
}