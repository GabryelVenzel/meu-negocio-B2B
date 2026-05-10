"use client";

import { useEffect, useState } from "react";
import { db } from "@/firebase/config";
import { doc, getDoc } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";

export default function OrcamentoPDF() {
  const { id } = useParams();
  const router = useRouter();
  const [chat, setChat] = useState<any>(null);
  const [produto, setProduto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      try {
        // 1. Busca os dados do Chat
        const chatRef = doc(db, "chats", id as string);
        const chatSnap = await getDoc(chatRef);
        
        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          setChat(chatData);

          // 2. Busca os dados reais do Produto usando o ID salvo no chat
          const prodRef = doc(db, "produtos", chatData.produto_id);
          const prodSnap = await getDoc(prodRef);
          if (prodSnap.exists()) {
            setProduto(prodSnap.data());
          }
        }
      } catch (error) {
        console.error("Erro ao gerar orçamento:", error);
      } finally {
        setCarregando(false);
      }
    };

    carregarDados();
  }, [id]);

  if (carregando) return <div className="p-20 text-center">A processar documento oficial...</div>;
  if (!produto || !chat) return <div className="p-20 text-center">Dados insuficientes para gerar o orçamento.</div>;

  const dataAtual = new Date().toLocaleDateString('pt-BR');

  return (
    <main className="min-h-screen bg-gray-200 py-10 print:bg-white print:py-0">
      
      {/* Barra de Ferramentas (Escondida na impressão) */}
      <div className="max-w-4xl mx-auto mb-6 flex justify-between items-center print:hidden px-4">
        <button onClick={() => router.back()} className="text-gray-600 font-medium hover:text-slate-900">&larr; Voltar ao Chat</button>
        <button 
          onClick={() => window.print()} 
          className="bg-orange-600 text-white px-6 py-2 rounded-lg font-bold shadow-lg hover:bg-orange-700 transition"
        >
          🖨️ Guardar como PDF / Imprimir
        </button>
      </div>

      {/* A Folha A4 */}
      <div className="max-w-4xl mx-auto bg-white p-12 md:p-20 shadow-2xl print:shadow-none print:p-0">
        
        {/* Cabeçalho do Orçamento */}
        <header className="border-b-4 border-slate-900 pb-8 mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-black text-slate-900 tracking-tighter">NEXUS<span className="text-orange-500">B2B</span></h1>
            <p className="text-gray-500 text-sm mt-1">Plataforma de Negócios Industriais</p>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-slate-800">PROPOSTA COMERCIAL</h2>
            <p className="text-sm font-medium text-gray-500">Ref: ORC-{id?.toString().substring(0, 6).toUpperCase()}</p>
            <p className="text-sm text-gray-500">Data: {dataAtual}</p>
          </div>
        </header>

        {/* Dados das Partes */}
        <div className="grid grid-cols-2 gap-10 mb-12">
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Fornecedor</h3>
            <p className="font-bold text-slate-900">{produto.vendedor_email}</p>
            <p className="text-sm text-gray-600 mt-1">Vendedor verificado Nexus B2B</p>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg border border-gray-100">
            <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-2">Cliente / Comprador</h3>
            <p className="font-bold text-slate-900">ID de Negociação Nexus</p>
            <p className="text-sm text-gray-600 mt-1">{chat.participantes[0]}</p>
          </div>
        </div>

        {/* Detalhes do Produto */}
        <div className="mb-12">
          <h3 className="text-lg font-bold text-slate-900 mb-4 border-b pb-2">Especificações do Item</h3>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100 text-slate-700">
                <th className="p-3 font-bold">Item / Descrição</th>
                <th className="p-3 font-bold">Categoria</th>
                <th className="p-3 font-bold text-right">Preço Unitário</th>
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-gray-100">
                <td className="p-3">
                  <p className="font-bold text-slate-900">{produto.nome}</p>
                  <p className="text-sm text-gray-500 mt-1">{produto.descricao?.substring(0, 100)}...</p>
                  {produto.norma && <span className="inline-block mt-2 px-2 py-1 bg-orange-100 text-orange-700 text-xs font-bold rounded">{produto.norma}</span>}
                </td>
                <td className="p-3 text-gray-600">{produto.categoria}</td>
                <td className="p-3 text-right font-bold text-slate-900">
                  {produto.sobConsulta ? "Sob Consulta" : `R$ ${produto.preco?.toFixed(2)}`}
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        {/* Termos e Assinatura */}
        <div className="mt-20 pt-8 border-t border-gray-200">
          <p className="text-xs text-gray-400 text-center mb-16">
            Este é um documento de intenção gerado automaticamente pela plataforma Nexus B2B. As condições finais de frete e pagamento devem ser alinhadas diretamente entre as partes no chat oficial. Validade da proposta: 7 dias.
          </p>
          
          <div className="grid grid-cols-2 gap-20">
            <div className="text-center">
              <div className="border-t border-slate-400 w-full mb-2"></div>
              <p className="text-sm font-bold text-slate-700">Assinatura do Fornecedor</p>
            </div>
            <div className="text-center">
              <div className="border-t border-slate-400 w-full mb-2"></div>
              <p className="text-sm font-bold text-slate-700">De Acordo (Comprador)</p>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}