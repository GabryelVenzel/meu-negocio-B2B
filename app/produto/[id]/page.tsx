"use client";

import { useEffect, useState } from "react";
import { db, auth } from "@/firebase/config";
import { doc, getDoc, collection, setDoc, addDoc, serverTimestamp, query, where, getDocs } from "firebase/firestore";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ProdutoDetalhe() {
  const { id } = useParams();
  const router = useRouter();
  const [produto, setProduto] = useState<any>(null);
  const [carregando, setCarregando] = useState(true);
  const [iniciandoChat, setIniciandoChat] = useState(false);
  
  // NOVO: Estados para armazenar a nota
  const [mediaAvaliacoes, setMediaAvaliacoes] = useState<number>(0);
  const [totalAvaliacoes, setTotalAvaliacoes] = useState<number>(0);

  useEffect(() => {
    const carregarProdutoEAvaliacoes = async () => {
      if (!id) return;
      try {
        // 1. Busca o Produto
        const docSnap = await getDoc(doc(db, "produtos", id as string));
        if (docSnap.exists()) {
          setProduto({ id: docSnap.id, ...docSnap.data() });
        }

        // 2. Busca as Avaliações deste produto
        const qAvaliacoes = query(collection(db, "avaliacoes"), where("produto_id", "==", id as string));
        const snapAvaliacoes = await getDocs(qAvaliacoes);
        
        if (!snapAvaliacoes.empty) {
          let somaNotas = 0;
          snapAvaliacoes.forEach(doc => {
            somaNotas += doc.data().nota;
          });
          setMediaAvaliacoes(somaNotas / snapAvaliacoes.size);
          setTotalAvaliacoes(snapAvaliacoes.size);
        }

      } catch (error) {
        console.error("Erro ao carregar os dados", error);
      } finally {
        setCarregando(false);
      }
    };
    
    carregarProdutoEAvaliacoes();
  }, [id]);

  const iniciarNegociacao = async () => {
    if (!auth.currentUser) {
      alert("Você precisa fazer login para cotar este produto.");
      router.push("/login");
      return;
    }

    if (auth.currentUser.uid === produto.vendedor_id) {
      alert("Você não pode abrir uma negociação no seu próprio produto.");
      return;
    }

    setIniciandoChat(true);

    try {
      const chatId = `${produto.id}_${auth.currentUser.uid}`;
      const chatRef = doc(db, "chats", chatId);
      const chatSnap = await getDoc(chatRef);

      if (!chatSnap.exists()) {
        await setDoc(chatRef, {
          participantes: [auth.currentUser.uid, produto.vendedor_id],
          produto_id: produto.id,
          produto_nome: produto.nome,
          ultima_mensagem_texto: "Olá! Tenho interesse neste item e gostaria de formalizar uma cotação.",
          ultima_mensagem_data: serverTimestamp()
        });

        await addDoc(collection(db, "chats", chatId, "mensagens"), {
          texto: "Olá! Tenho interesse neste item e gostaria de formalizar uma cotação.",
          autor_id: auth.currentUser.uid,
          autor_email: auth.currentUser.email,
          data: serverTimestamp()
        });
      }
      
      router.push(`/dashboard/mensagens/${chatId}`);
    } catch (error) {
      console.error("Erro ao iniciar chat:", error);
      alert("Houve um erro ao tentar contatar o fornecedor.");
      setIniciandoChat(false);
    }
  };

  if (carregando) return <div className="min-h-screen flex items-center justify-center bg-gray-50 text-gray-500">A processar catálogo...</div>;
  if (!produto) return <div className="min-h-screen flex items-center justify-center text-red-500">Item não encontrado ou removido.</div>;

  let menorPreco = produto.preco;
  let maiorPreco = produto.preco;
  let temDescontoVolume = false;

  if (produto.faixasAtacado && produto.faixasAtacado.length > 0) {
    const todosOsPrecos = [produto.preco, ...produto.faixasAtacado.map((f: any) => f.preco)];
    menorPreco = Math.min(...todosOsPrecos);
    maiorPreco = Math.max(...todosOsPrecos);
    temDescontoVolume = menorPreco < maiorPreco;
  }

  // Função auxiliar para desenhar as estrelas
  const renderizarEstrelas = () => {
    const estrelas = [];
    const notaArredondada = Math.round(mediaAvaliacoes);
    for (let i = 1; i <= 5; i++) {
      estrelas.push(
        <span key={i} className={`text-lg ${i <= notaArredondada ? 'text-yellow-400' : 'text-gray-200'}`}>
          ★
        </span>
      );
    }
    return estrelas;
  };

  return (
    <main className="min-h-screen bg-gray-50 pb-20">
      <header className="bg-slate-900 text-white p-6 shadow-md flex justify-between items-center">
        <Link href="/" className="text-2xl font-black text-white tracking-tighter">
          NEXUS<span className="text-orange-500">B2B</span>
        </Link>
        <Link href="/dashboard" className="text-sm font-medium hover:text-orange-400 transition">Acessar Painel</Link>
      </header>

      <div className="max-w-6xl mx-auto mt-10 px-6">
        <button onClick={() => router.back()} className="text-gray-500 font-medium mb-6 hover:text-slate-900 transition">
          &larr; Voltar para a busca
        </button>

        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col md:flex-row">
          
          <div className="w-full md:w-1/2 bg-gray-50 p-10 flex items-center justify-center relative border-r border-gray-100">
            {produto.imagemUrl ? (
              <img src={produto.imagemUrl} alt={produto.nome} className="max-h-[500px] object-contain drop-shadow-xl" />
            ) : (
              <div className="text-gray-300 font-bold uppercase tracking-widest">Imagem Indisponível</div>
            )}
            {produto.norma && (
              <span className="absolute top-6 left-6 bg-slate-900 text-white text-xs font-bold px-3 py-1.5 rounded uppercase tracking-wider shadow-md">
                Norma: {produto.norma}
              </span>
            )}
          </div>

          <div className="w-full md:w-1/2 p-10 lg:p-14 flex flex-col">
            <span className="text-xs font-bold text-orange-600 uppercase tracking-widest mb-2">{produto.categoria}</span>
            <h1 className="text-4xl font-black text-slate-900 mb-2 leading-tight">{produto.nome}</h1>
            
            {/* NOVO: Bloco de Avaliação */}
            <div className="flex items-center gap-3 mb-6">
              {totalAvaliacoes > 0 ? (
                <div className="flex items-center gap-2 bg-yellow-50 px-3 py-1.5 rounded-full border border-yellow-100">
                  <div className="flex">{renderizarEstrelas()}</div>
                  <span className="text-sm font-bold text-yellow-700">{mediaAvaliacoes.toFixed(1)}</span>
                  <span className="text-xs text-yellow-600 font-medium">({totalAvaliacoes} {totalAvaliacoes === 1 ? 'avaliação' : 'avaliações'})</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 bg-gray-50 px-3 py-1.5 rounded-full border border-gray-100 text-xs text-gray-500">
                  <span className="text-gray-300 text-lg">★</span> Novo Fornecedor (Sem avaliações)
                </div>
              )}
            </div>

            <div className="flex items-center gap-4 text-sm text-gray-500 mb-8 pb-8 border-b border-gray-100">
              <p><strong>Marca/Fab:</strong> {produto.marca || "Não informada"}</p>
              <span>|</span>
              <p><strong>Vendido por:</strong> {produto.vendedor_email}</p>
            </div>

            <div className="mb-8">
              {produto.sobConsulta ? (
                <span className="text-4xl font-black text-slate-900">Preço Sob Consulta</span>
              ) : temDescontoVolume ? (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Valor Unitário no Atacado</p>
                  <p className="text-4xl font-black text-orange-600">
                    R$ {menorPreco.toFixed(2)} <span className="text-2xl text-slate-400 font-medium">a R$ {maiorPreco.toFixed(2)}</span>
                  </p>
                  
                  <div className="mt-6 bg-orange-50/50 border border-orange-100 rounded-xl p-5">
                    <h4 className="text-xs font-bold text-orange-800 uppercase tracking-wider mb-4 flex items-center gap-2">
                      <span>📉</span> Tabela de Descontos por Volume
                    </h4>
                    <ul className="space-y-3 text-sm">
                      <li className="flex justify-between items-center text-slate-700 pb-2 border-b border-orange-100/50">
                        <span>Até {(produto.faixasAtacado[0]?.qtd || 2) - 1} {produto.unidade}</span>
                        <span className="font-medium text-gray-500">R$ {produto.preco?.toFixed(2)} / {produto.unidade}</span>
                      </li>
                      {produto.faixasAtacado.map((faixa: any, idx: number) => (
                        <li key={idx} className="flex justify-between items-center text-slate-800">
                          <span className="font-medium">Acima de {faixa.qtd} {produto.unidade}</span>
                          <span className="font-bold text-orange-600">R$ {faixa.preco?.toFixed(2)} / {produto.unidade}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              ) : (
                <div>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1">Valor Unitário</p>
                  <span className="text-4xl font-black text-slate-900">R$ {produto.preco?.toFixed(2)} <span className="text-base text-gray-400 font-medium">/ {produto.unidade}</span></span>
                </div>
              )}
            </div>

            <div className="mb-10">
              <h3 className="font-bold text-slate-900 mb-2">Descrição Técnica</h3>
              <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{produto.descricao}</p>
            </div>

            <div className="mt-auto pt-8 border-t border-gray-100 flex flex-col sm:flex-row gap-4">
              <button 
                onClick={iniciarNegociacao}
                disabled={iniciandoChat}
                className="flex-1 bg-slate-900 text-white py-4 px-8 rounded-xl font-bold text-lg hover:bg-slate-800 transition shadow-xl shadow-slate-900/20 disabled:bg-gray-400 flex items-center justify-center gap-3"
              >
                {iniciandoChat ? "Abrindo Sala..." : "💬 Iniciar Cotação Oficial"}
              </button>
              
              {produto.fichaUrl && (
                <a 
                  href={produto.fichaUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="flex-1 sm:flex-none bg-white border-2 border-gray-200 text-slate-700 py-4 px-8 rounded-xl font-bold hover:border-orange-500 hover:text-orange-600 transition text-center flex items-center justify-center gap-2"
                >
                  📄 Baixar PDF
                </a>
              )}
            </div>

          </div>
        </div>
      </div>
    </main>
  );
}