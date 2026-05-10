"use client";

import { useEffect, useState } from "react";
import { doc, getDoc, collection, addDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useParams, useRouter } from "next/navigation";

export default function DetalheProduto() {
  const { id } = useParams();
  const [produto, setProduto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const router = useRouter();

  // Estados para o Modal de Cotação
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
    setEnviando(true);
    try {
      // Salva a cotação no Firebase
      await addDoc(collection(db, "cotacoes"), {
        produto_id: id,
        nome_produto: produto.nome,
        vendedor_id: produto.vendedor_id, // Para o vendedor achar essa cotação no painel dele
        vendedor_email: produto.vendedor_email,
        nome_comprador: nomeComprador,
        telefone_comprador: telefoneComprador,
        mensagem: mensagem,
        status: "Nova",
        data_solicitacao: new Date()
      });
      alert("Cotação enviada com sucesso! O vendedor entrará em contato.");
      setModalAberto(false); // Fecha o modal
    } catch (error) {
      console.error(error);
      alert("Erro ao enviar cotação.");
    } finally {
      setEnviando(false);
    }
  };

  if (carregando) return <div className="p-20 text-center">Carregando detalhes...</div>;
  if (!produto) return <div className="p-20 text-center">Produto não encontrado.</div>;

  return (
    <main className="min-h-screen bg-white p-8 relative">
      <div className="max-w-5xl mx-auto">
        <button onClick={() => router.back()} className="mb-6 text-sm text-gray-500 hover:text-orange-600">← Voltar para a busca</button>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
          {/* Coluna da Imagem */}
          <div className="rounded-2xl overflow-hidden border border-gray-100 bg-gray-50 flex items-center justify-center">
            {produto.imagemUrl ? (
              <img src={produto.imagemUrl} alt={produto.nome} className="w-full object-contain max-h-[500px]" />
            ) : (
              <div className="h-96 flex items-center justify-center text-gray-400">Sem imagem disponível</div>
            )}
          </div>

          {/* Coluna das Informações */}
          <div className="flex flex-col">
            <span className="px-3 py-1 bg-orange-100 text-orange-700 rounded-full text-xs font-bold w-fit mb-4">
              {produto.categoria}
            </span>
            <h1 className="text-4xl font-bold text-slate-900 mb-4">{produto.nome}</h1>
            <p className="text-3xl font-light text-slate-800 mb-8">
              R$ {produto.preco.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </p>

            <div className="bg-gray-50 p-6 rounded-xl mb-8">
              <h3 className="font-bold text-slate-900 mb-2">Descrição Técnica</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{produto.descricao}</p>
            </div>

            <div className="mt-auto space-y-4">
              <button 
                onClick={() => setModalAberto(true)}
                className="w-full bg-slate-900 text-white py-4 rounded-lg font-bold hover:bg-slate-800 transition shadow-lg"
              >
                Solicitar Cotação Direta
              </button>
              <p className="text-center text-xs text-gray-400">Vendido por: {produto.vendedor_email}</p>
            </div>
          </div>
        </div>
      </div>

      {/* MODAL DE COTAÇÃO */}
      {modalAberto && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4 backdrop-blur-sm">
          <div className="bg-white p-8 rounded-xl w-full max-w-md shadow-2xl relative">
            <button onClick={() => setModalAberto(false)} className="absolute top-4 right-4 text-gray-400 hover:text-gray-800 text-xl font-bold">×</button>
            <h2 className="text-2xl font-bold text-slate-900 mb-2">Solicitar Cotação</h2>
            <p className="text-gray-500 text-sm mb-6">Deixe seus dados para o fornecedor de <strong>{produto.nome}</strong> entrar em contato.</p>
            
            <form onSubmit={handleEnviarCotacao} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Seu Nome / Empresa</label>
                <input type="text" required value={nomeComprador} onChange={e => setNomeComprador(e.target.value)} className="w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-orange-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">WhatsApp / Telefone</label>
                <input type="tel" required value={telefoneComprador} onChange={e => setTelefoneComprador(e.target.value)} className="w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-orange-500" placeholder="(11) 90000-0000" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Mensagem ou Quantidade desejada</label>
                <textarea required rows={3} value={mensagem} onChange={e => setMensagem(e.target.value)} className="w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-orange-500 resize-none" />
              </div>
              <button type="submit" disabled={enviando} className="w-full bg-orange-600 text-white font-bold py-3 rounded-md hover:bg-orange-700 transition disabled:bg-gray-400 mt-4">
                {enviando ? "Enviando..." : "Enviar Cotação"}
              </button>
            </form>
          </div>
        </div>
      )}
    </main>
  );
}