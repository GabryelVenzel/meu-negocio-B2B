"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, addDoc, setDoc, serverTimestamp} from "firebase/firestore";
import { db, auth } from "@/firebase/config";
import { useParams, useRouter } from "next/navigation";

export default function DetalheProduto() {
  const { id } = useParams();
  const [produto, setProduto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // Estados do Modal
  const [modalAberto, setModalAberto] = useState(false);
  const [nomeComprador, setNomeComprador] = useState("");
  const [telefoneComprador, setTelefoneComprador] = useState("");
  const [mensagem, setMensagem] = useState("Olá, tenho interesse neste item e gostaria de uma cotação.");
  const [enviando, setEnviando] = useState(false);

  useEffect(() => {
    const buscarProduto = async () => {
      if (!id) return;
      const docRef = doc(db, "produtos", id as string);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) setProduto(docSnap.data());
      setCarregando(false);
    };
    buscarProduto();
  }, [id]);

  const handleEnviarCotacao = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!auth.currentUser) {
      alert("Precisa de iniciar sessão para negociar.");
      router.push("/login");
      return;
    }

    setEnviando(true);
    console.log("Iniciando processo de cotação...");

    try {
      // Criamos um ID único para a conversa entre ESTE comprador e ESTE produto
      const chatId = `${id}_${auth.currentUser.uid}`;

      // 1. Criar ou atualizar o cabeçalho da conversa
      console.log("Criando documento de chat...");
      await setDoc(doc(db, "chats", chatId), {
        participantes: [auth.currentUser.uid, produto.vendedor_id],
        produto_nome: produto.nome,
        produto_id: id,
        comprador_id: auth.currentUser.uid,
        ultima_mensagem_texto: mensagem,
        ultima_mensagem_data: serverTimestamp()
      }, { merge: true });

      // 2. Adicionar a primeira mensagem na subcoleção
      console.log("Enviando primeira mensagem...");
      await addDoc(collection(db, "chats", chatId, "mensagens"), {
        texto: mensagem,
        autor_id: auth.currentUser.uid,
        autor_email: auth.currentUser.email,
        data: serverTimestamp()
      });

      console.log("Sucesso! Redirecionando...");
      alert("Negociação iniciada com sucesso!");
      setModalAberto(false);
      
      // Redireciona para a central de mensagens
      router.push("/dashboard/mensagens");

    } catch (error) {
      console.error("Erro detalhado ao enviar cotação:", error);
      alert("Ocorreu um erro técnico ao iniciar o chat. Verifique o console.");
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <div className="p-20 text-center text-gray-500">A carregar especificações...</div>;
  if (!produto) return <div className="p-20 text-center">Produto não encontrado no catálogo.</div>;

  return (
    <main className="min-h-screen bg-white p-8 relative border-t-4 border-slate-900">
      <div className="max-w-6xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-sm text-gray-500 hover:text-orange-600 transition font-medium">
          &larr; Voltar para resultados
        </button>
        
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          
          {/* Coluna Esquerda: Mídia */}
          <div className="space-y-6">
            <div className="rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm p-4 flex items-center justify-center aspect-square">
              {produto.imagemUrl ? (
                <img src={produto.imagemUrl} alt={produto.nome} className="w-full h-full object-contain hover:scale-105 transition duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 bg-gray-50 rounded-xl">Sem imagem</div>
              )}
            </div>

            {/* Botão de Ficha Técnica (Aparece apenas se houver PDF) */}
            {produto.fichaUrl && (
              <a 
                href={produto.fichaUrl} 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center justify-center w-full py-4 bg-slate-100 text-slate-700 font-bold rounded-lg border border-slate-200 hover:bg-slate-200 transition"
              >
                <svg className="w-5 h-5 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path></svg>
                Baixar Ficha Técnica / Manual (PDF)
              </a>
            )}
          </div>

          {/* Coluna Direita: Dados Comerciais e Técnicos */}
          <div className="flex flex-col">
            
            {/* Tags e Badges */}
            <div className="flex flex-wrap gap-2 mb-4">
              <span className="px-3 py-1 bg-slate-100 text-slate-700 rounded text-xs font-bold uppercase tracking-wider">
                {produto.categoria}
              </span>
              {produto.norma && (
                <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded text-xs font-bold uppercase tracking-wider border border-orange-200">
                  {produto.norma}
                </span>
              )}
            </div>

            <h1 className="text-4xl font-bold text-slate-900 mb-2 leading-tight">{produto.nome}</h1>
            
            {produto.marca && (
              <p className="text-gray-500 font-medium mb-6">Fabricante: <span className="text-slate-800">{produto.marca}</span></p>
            )}

            {/* Lógica do Preço vs Sob Consulta */}
            <div className="bg-slate-50 p-6 rounded-xl border border-gray-100 mb-8 flex flex-col justify-center">
              {produto.sobConsulta ? (
                <div>
                  <p className="text-3xl font-bold text-slate-900 mb-1">Preço sob consulta</p>
                  <p className="text-sm text-gray-500">Sujeito a orçamento e análise de volume.</p>
                </div>
              ) : (
                <div>
                  <p className="text-4xl font-black text-orange-600 mb-1">
                    R$ {produto.preco?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    <span className="text-lg text-gray-500 font-medium ml-2">/ {produto.unidade || "UN"}</span>
                  </p>
                  <p className="text-sm text-gray-500">Condições de pagamento direto com o fornecedor.</p>
                </div>
              )}
            </div>

            {/* Descrição Técnica */}
            <div className="mb-10">
              <h3 className="font-bold text-slate-900 mb-3 text-lg border-b pb-2">Especificações Técnicas</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap text-sm md:text-base">
                {produto.descricao}
              </p>
            </div>

            {/* Área de Ação */}
            <div className="mt-auto space-y-4 pt-6 border-t border-gray-100">
              <button 
                onClick={() => setModalAberto(true)}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold text-lg hover:bg-slate-800 transition shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
              >
                {produto.sobConsulta ? "Solicitar Orçamento Formal" : "Iniciar Negociação / Cotar"}
              </button>
              
              <div className="flex items-center justify-center p-4 bg-gray-50 rounded-lg">
                <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"></path></svg>
                <p className="text-center text-sm font-medium text-gray-600">
                  Fornecido por: <span className="text-slate-900 font-bold">{produto.vendedor_email}</span>
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* MODAL DE COTAÇÃO MANTIDO E OTIMIZADO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-slate-900/80 flex items-center justify-center z-50 p-4 backdrop-blur-sm transition-opacity">
          <div className="bg-white p-8 rounded-2xl w-full max-w-md shadow-2xl relative border-t-4 border-orange-500">
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-slate-900 text-2xl font-bold leading-none">&times;</button>
            
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Solicitar Cotação</h2>
            <p className="text-gray-500 text-sm mb-6">O fornecedor de <strong className="text-slate-800">{produto.nome}</strong> receberá o seu contato diretamente no painel.</p>
            
            <form onSubmit={handleEnviarCotacao} className="space-y-4">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Empresa / Nome</label>
                <input type="text" required value={nomeComprador} onChange={e => setNomeComprador(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition" placeholder="Sua Razão Social" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">WhatsApp de Contato</label>
                <input type="tel" required value={telefoneComprador} onChange={e => setTelefoneComprador(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 transition" placeholder="(11) 90000-0000" />
              </div>
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-1">Especificações / Volume Desejado</label>
                <textarea required rows={4} value={mensagem} onChange={e => setMensagem(e.target.value)} className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-lg outline-none focus:ring-2 focus:ring-orange-500 resize-none transition" />
              </div>
              <button type="submit" disabled={enviando} className="w-full bg-orange-600 text-white font-bold py-4 rounded-lg hover:bg-orange-700 transition disabled:bg-gray-400 mt-2 text-lg shadow-lg">
                {enviando ? "A Enviar Cotação..." : "Enviar Cotação Oficial"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}