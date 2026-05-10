"use client";

import { useState } from "react";
import { auth, db, storage } from "@/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function NovoProduto() {
  // Dados Básicos
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  
  // Especificações
  const [unidade, setUnidade] = useState("UN");
  const [norma, setNorma] = useState("");
  const [descricao, setDescricao] = useState("");
  
  // Precificação
  const [preco, setPreco] = useState("");
  const [sobConsulta, setSobConsulta] = useState(false);
  
  // NOVO: Preços por Lote/Volume
  const [faixasAtacado, setFaixasAtacado] = useState<{ qtd: string; preco: string }[]>([]);
  
  // Arquivos
  const [imagem, setImagem] = useState<File | null>(null);
  const [fichaTecnica, setFichaTecnica] = useState<File | null>(null);
  
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  // Funções para gerir as faixas de preço
  const adicionarFaixa = () => {
    setFaixasAtacado([...faixasAtacado, { qtd: "", preco: "" }]);
  };

  const atualizarFaixa = (index: number, campo: "qtd" | "preco", valor: string) => {
    const novasFaixas = [...faixasAtacado];
    novasFaixas[index][campo] = valor;
    setFaixasAtacado(novasFaixas);
  };

  const removerFaixa = (index: number) => {
    setFaixasAtacado(faixasAtacado.filter((_, i) => i !== index));
  };

const gerarKeywords = (nome: string, categoria: string, marca: string) => {
  const keywords = new Set<string>();
  
  const tratarTexto = (texto: string) => 
    texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

  const n = tratarTexto(nome);
  const c = tratarTexto(categoria);
  const m = tratarTexto(marca);

    const adicionarTermos = (texto: string) => {
      if (!texto) return;
      
      // 1. Adiciona a frase completa (Ex: "playstation 5")
      keywords.add(texto);

      // 2. Adiciona prefixos da frase (Ex: "pl", "pla", "play...")
      for (let i = 2; i <= texto.length; i++) {
        keywords.add(texto.substring(0, i));
      }

      // 3. Adiciona palavras individuais e seus prefixos
      const palavras = texto.split(/\s+/);
      palavras.forEach(p => {
        const limpa = p.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "");
        if (limpa.length >= 2) {
          keywords.add(limpa);
          for (let i = 2; i <= limpa.length; i++) {
            keywords.add(limpa.substring(0, i));
          }
        } else if (limpa.length > 0) {
          keywords.add(limpa);
        }
      });
    };

    adicionarTermos(n);
    adicionarTermos(c);
    adicionarTermos(m);

    return Array.from(keywords);
  };

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Sessão expirada.");
    
    if (!sobConsulta && (!preco || parseFloat(preco) <= 0)) {
      return alert("Informe um preço base válido ou marque 'Preço sob consulta'.");
    }

    // Validação de imagem
    if (imagem && imagem.size > 2 * 1024 * 1024) {
      return alert("A imagem principal não pode ter mais de 2MB.");
    }

    setCarregando(true);

    try {
      let imagemUrl = "";
      let fichaUrl = "";
      const timestamp = Date.now();

      // Uploads
      if (imagem) {
        const imagemRef = ref(storage, `produtos/${auth.currentUser.uid}/${timestamp}_img_${imagem.name}`);
        await uploadBytes(imagemRef, imagem);
        imagemUrl = await getDownloadURL(imagemRef);
      }

      if (fichaTecnica) {
        const fichaRef = ref(storage, `documentos/${auth.currentUser.uid}/${timestamp}_doc_${fichaTecnica.name}`);
        await uploadBytes(fichaRef, fichaTecnica);
        fichaUrl = await getDownloadURL(fichaRef);
      }

      // Formatar as faixas de atacado (converter para número e ordenar por quantidade)
      const faixasFormatadas = faixasAtacado
        .filter(f => f.qtd && f.preco) // Remove linhas vazias
        .map(f => ({
          qtd: parseInt(f.qtd, 10),
          preco: parseFloat(f.preco.replace(",", "."))
        }))
        .sort((a, b) => a.qtd - b.qtd);

      await addDoc(collection(db, "produtos"), {
        nome,
        categoria,
        marca,
        unidade,
        norma,
        descricao,
        preco: sobConsulta ? 0 : parseFloat(preco.replace(",", ".")),
        sobConsulta,
        faixasAtacado: sobConsulta ? [] : faixasFormatadas, // Salva as faixas no banco
        imagemUrl,
        fichaUrl,
        vendedor_id: auth.currentUser.uid,
        vendedor_email: auth.currentUser.email,
        data_cadastro: new Date()
      });

      alert("Produto B2B catalogado com sucesso!");
      router.push("/dashboard/meu-catalogo");

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Ocorreu um erro ao cadastrar o produto.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Catálogo Técnico</h1>
            <p className="text-gray-500 text-sm mt-1">Preencha as especificações do material ou equipamento.</p>
          </div>
          <Link href="/dashboard" className="text-gray-500 hover:text-orange-600 transition font-medium">
            Voltar
          </Link>
        </div>

        <form onSubmit={handleSalvarProduto} className="space-y-8">
          
          {/* SEÇÃO 1: Dados Básicos */}
          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">1. Identificação</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Produto / Equipamento *</label>
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Categoria *</label>
                <select required value={categoria} onChange={(e) => setCategoria(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                  <option value="">Selecione...</option>
                  <option value="EPI">EPIs e Segurança</option>
                  <option value="Maquinario">Máquinas e Equipamentos</option>
                  <option value="Estruturas">Estruturas e Andaimes</option>
                  <option value="Materiais">Materiais Brutos</option>
                  <option value="Servicos">Engenharia e Serviços</option>
                </select>
              </div>
            </div>
          </div>

          {/* SEÇÃO 2: Especificações Técnicas */}
          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">2. Especificações B2B</h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Fabricante / Marca</label>
                <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Norma / CA (Opcional)</label>
                <input type="text" value={norma} onChange={(e) => setNorma(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: NR12" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Venda</label>
                <select value={unidade} onChange={(e) => setUnidade(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                  <option value="UN">Unidade (UN)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="TON">Tonelada (TON)</option>
                  <option value="M">Metro Linear (M)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Técnica Detalhada *</label>
                <textarea rows={4} required value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none resize-none" />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Preço e Escala */}
          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">3. Comercial e Valores</h2>
            
            <div className="mb-6 pb-6 border-b border-gray-200">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base Unitário (R$)</label>
                  <input 
                    type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} disabled={sobConsulta}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 disabled:bg-gray-200 disabled:text-gray-400" 
                    placeholder="Ex: 150.00" 
                  />
                </div>
                <div className="flex items-center h-10">
                  <label className="flex items-center space-x-2 cursor-pointer">
                    <input type="checkbox" checked={sobConsulta} onChange={(e) => {
                      setSobConsulta(e.target.checked);
                      if (e.target.checked) setFaixasAtacado([]); // Limpa as faixas se for sob consulta
                    }} className="w-5 h-5 text-orange-600 rounded focus:ring-orange-500" />
                    <span className="text-sm font-bold text-slate-700">Ocultar valor (Preço Sob Consulta)</span>
                  </label>
                </div>
              </div>
            </div>

            {/* PRECIFICAÇÃO POR LOTE (Desabilitado se for Sob Consulta) */}
            {!sobConsulta && (
              <div className="space-y-4 mb-6">
                <div className="flex justify-between items-center">
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Descontos por Volume (Atacado)</h3>
                    <p className="text-xs text-gray-500">Adicione preços menores para quem comprar em grande quantidade.</p>
                  </div>
                  <button type="button" onClick={adicionarFaixa} className="text-sm bg-slate-900 text-white px-4 py-2 rounded font-medium hover:bg-slate-800 transition">
                    + Adicionar Lote
                  </button>
                </div>

                {faixasAtacado.length > 0 && (
                  <div className="bg-white p-4 border border-gray-200 rounded-lg space-y-3">
                    {faixasAtacado.map((faixa, index) => (
                      <div key={index} className="flex items-center gap-4">
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">A partir de (Quant.)</label>
                          <input type="number" min="2" value={faixa.qtd} onChange={(e) => atualizarFaixa(index, "qtd", e.target.value)} placeholder="Ex: 50" className="w-full px-3 py-2 border rounded-md text-sm" />
                        </div>
                        <div className="flex-1">
                          <label className="block text-xs text-gray-500 mb-1">Novo Preço Unitário (R$)</label>
                          <input type="number" step="0.01" value={faixa.preco} onChange={(e) => atualizarFaixa(index, "preco", e.target.value)} placeholder="Ex: 130.00" className="w-full px-3 py-2 border rounded-md text-sm" />
                        </div>
                        <button type="button" onClick={() => removerFaixa(index)} className="mt-5 text-red-500 hover:text-red-700 font-bold px-2" title="Remover faixa">
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* SEÇÃO 4: Mídia */}
          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">4. Anexos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Foto Principal (Obrigatório, Máx 2MB)</label>
                <input type="file" accept="image/*" required onChange={(e) => setImagem(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ficha Técnica / Manual (PDF Opcional)</label>
                <input type="file" accept=".pdf" onChange={(e) => setFichaTecnica(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-200 file:text-slate-700" />
              </div>
            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={carregando} className="px-10 py-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shadow-xl disabled:bg-gray-400 text-lg">
              {carregando ? "A processar..." : "Publicar no Catálogo B2B"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}