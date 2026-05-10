"use client";

import { useEffect, useState, useRef } from "react";
import { auth, db } from "@/firebase/config";
import { collection, query, orderBy, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, getDoc, setDoc } from "firebase/firestore";
import { onAuthStateChanged, User } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";

export default function ChatRoom() {
  const { id } = useParams();
  const [mensagens, setMensagens] = useState<any[]>([]);
  const [novaMensagem, setNovaMensagem] = useState("");
  const [user, setUser] = useState<User | null>(null);
  const [chatInfo, setChatInfo] = useState<any>(null); // NOVO: Guarda as info do chat
  const [carregando, setCarregando] = useState(true);
  
  // NOVO: Estados do Modal de Avaliação
  const [mostrarAvaliacao, setMostrarAvaliacao] = useState(false);
  const [nota, setNota] = useState(5);
  const [comentarioAvaliacao, setComentarioAvaliacao] = useState("");
  const [enviandoAvaliacao, setEnviandoAvaliacao] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!id) return;

    const unsubscribeAuth = onAuthStateChanged(auth, async (usuarioLogado) => {
      if (usuarioLogado) {
        setUser(usuarioLogado);
        
        // 1. Busca os dados gerais do Chat para saber quem é o comprador/vendedor
        const chatDoc = await getDoc(doc(db, "chats", id as string));
        if (chatDoc.exists()) {
          setChatInfo(chatDoc.data());
        }

        // 2. Escuta as mensagens em tempo real
        const q = query(
          collection(db, "chats", id as string, "mensagens"),
          orderBy("data", "asc")
        );

        const unsubscribeSnapshot = onSnapshot(q, (snapshot) => {
          const msgs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
          setMensagens(msgs);
          setCarregando(false);
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
      await addDoc(collection(db, "chats", id as string, "mensagens"), {
        texto,
        autor_id: user.uid,
        autor_email: user.email,
        data: serverTimestamp()
      });

      await updateDoc(doc(db, "chats", id as string), {
        ultima_mensagem_texto: texto,
        ultima_mensagem_data: serverTimestamp()
      });
    } catch (erro) {
      console.error(erro);
    }
  };

  const enviarAvaliacao = async () => {
    if (!user || !chatInfo) return;
    setEnviandoAvaliacao(true);

    try {
      // TRUQUE DE SEGURANÇA: Se o produto_id não estiver no chatInfo, 
      // extraímos a primeira parte do ID da URL (que é o ID do produto)
      const produtoIdReal = chatInfo.produto_id || (id as string).split('_')[0];

      await setDoc(doc(db, "avaliacoes", id as string), {
        chat_id: id,
        produto_id: produtoIdReal, // Agora temos a certeza do ID
        produto_nome: chatInfo.produto_nome || "Produto Nexus",
        comprador_id: user.uid,
        vendedor_id: chatInfo.participantes[1],
        nota: nota,
        comentario: comentarioAvaliacao,
        data: serverTimestamp()
      });

      alert("Avaliação enviada com sucesso!");
      setMostrarAvaliacao(false);
      
      // Força um refresh para o utilizador ver a mudança (opcional)
      window.location.reload(); 
    } catch (error) {
      console.error("Erro detalhado:", error);
      alert("Erro ao enviar. Verifique o console do navegador.");
    } finally {
      setEnviandoAvaliacao(false);
    }
  };
  
  if (carregando) return <div className="h-screen flex items-center justify-center bg-gray-50 text-gray-500">Conectando à sala segura...</div>;

  // Lógica: O índice 0 do array participantes é quem iniciou o chat (o comprador)
  const isComprador = chatInfo?.participantes[0] === user?.uid;

  return (
    <main className="h-screen bg-white flex flex-col relative">
      
      {/* NOVO: Modal de Avaliação sobreposto à tela */}
      {mostrarAvaliacao && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
            <h2 className="text-2xl font-black text-slate-900 mb-2">Avaliar Fornecedor</h2>
            <p className="text-sm text-gray-500 mb-6">Como foi a sua negociação para o item <strong>{chatInfo?.produto_nome}</strong>?</p>
            
            <div className="mb-6 flex justify-center gap-2">
              {[1, 2, 3, 4, 5].map((estrela) => (
                <button 
                  key={estrela} 
                  onClick={() => setNota(estrela)}
                  className={`text-4xl transition-transform hover:scale-110 ${estrela <= nota ? 'text-yellow-400' : 'text-gray-200'}`}
                >
                  ★
                </button>
              ))}
            </div>

            <textarea 
              rows={3} 
              value={comentarioAvaliacao} 
              onChange={(e) => setComentarioAvaliacao(e.target.value)}
              placeholder="Ex: Ótimo atendimento, entregou o maquinário no prazo combinado."
              className="w-full px-4 py-3 border border-gray-200 rounded-lg mb-6 outline-none focus:ring-2 focus:ring-orange-500 resize-none text-sm"
            />

            <div className="flex gap-3">
              <button onClick={() => setMostrarAvaliacao(false)} className="flex-1 py-3 text-slate-600 font-bold hover:bg-gray-100 rounded-lg transition">Cancelar</button>
              <button onClick={enviarAvaliacao} disabled={enviandoAvaliacao} className="flex-1 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shadow-lg disabled:bg-gray-400">
                {enviandoAvaliacao ? "Enviando..." : "Enviar Avaliação"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CABEÇALHO DO CHAT */}
      <header className="p-4 border-b bg-slate-900 text-white flex justify-between items-center shadow-md">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-gray-400 hover:text-white font-medium">&larr; Voltar</button>
          <h1 className="font-bold text-orange-500 tracking-wider hidden md:block">Negociação: {chatInfo?.produto_nome || "Carregando..."}</h1>
        </div>
        
        <div className="flex items-center gap-3">
          {/* Botão de Avaliar só aparece para o comprador */}
          {isComprador && (
            <button 
              onClick={() => setMostrarAvaliacao(true)}
              className="flex items-center bg-yellow-500/10 text-yellow-500 hover:bg-yellow-500 hover:text-white px-4 py-2 rounded text-sm font-bold transition border border-yellow-500/50"
            >
              ⭐ Avaliar Fornecedor
            </button>
          )}

          <button 
            onClick={() => router.push(`/dashboard/mensagens/${id}/orcamento`)}
            className="flex items-center bg-slate-800 hover:bg-slate-700 px-4 py-2 rounded text-sm font-bold transition border border-slate-700"
          >
            📄 Gerar PDF
          </button>
        </div>
      </header>

      {/* ÁREA DE MENSAGENS */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-gray-50">
        {mensagens.map((m) => (
          <div key={m.id} className={`flex ${m.autor_id === user?.uid ? 'justify-end' : 'justify-start'}`}>
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

      {/* FORMULÁRIO DE ENVIO */}
      <form onSubmit={enviarMensagem} className="p-4 border-t bg-white flex gap-4 shadow-[0_-10px_40px_rgba(0,0,0,0.04)] z-10">
        <input 
          type="text" 
          value={novaMensagem}
          onChange={(e) => setNovaMensagem(e.target.value)}
          placeholder="Escreva a sua proposta ou dúvida..."
          className="flex-1 px-4 py-3 bg-gray-50 rounded-lg border border-gray-200 focus:ring-2 focus:ring-orange-500 outline-none transition"
        />
        <button type="submit" disabled={!novaMensagem.trim()} className="px-8 py-3 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shadow-lg disabled:bg-gray-400 disabled:cursor-not-allowed disabled:shadow-none">
          Enviar
        </button>
      </form>
    </main>
  );
}