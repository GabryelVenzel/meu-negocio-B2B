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
  const [norma, setNorma] = useState(""); // Para NR12, NR18, CAs, etc.
  const [descricao, setDescricao] = useState("");
  
  // Precificação
  const [preco, setPreco] = useState("");
  const [sobConsulta, setSobConsulta] = useState(false);
  
  // Arquivos
  const [imagem, setImagem] = useState<File | null>(null);
  const [fichaTecnica, setFichaTecnica] = useState<File | null>(null);
  
  const [carregando, setCarregando] = useState(false);
  const router = useRouter();

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return alert("Sessão expirada.");
    
    // Se não for "Sob Consulta", exige o preço
    if (!sobConsulta && (!preco || parseFloat(preco) <= 0)) {
      return alert("Informe um preço válido ou marque 'Preço sob consulta'.");
    }

    setCarregando(true);

    try {
      let imagemUrl = "";
      let fichaUrl = "";
      const timestamp = Date.now();

      // 1. Upload da Imagem
      if (imagem) {
        const imagemRef = ref(storage, `produtos/${auth.currentUser.uid}/${timestamp}_img_${imagem.name}`);
        await uploadBytes(imagemRef, imagem);
        imagemUrl = await getDownloadURL(imagemRef);
      }

      // 2. Upload da Ficha Técnica (PDF)
      if (fichaTecnica) {
        const fichaRef = ref(storage, `documentos/${auth.currentUser.uid}/${timestamp}_doc_${fichaTecnica.name}`);
        await uploadBytes(fichaRef, fichaTecnica);
        fichaUrl = await getDownloadURL(fichaRef);
      }

      // 3. Salvar no Firestore
      await addDoc(collection(db, "produtos"), {
        nome,
        categoria,
        marca,
        unidade,
        norma,
        descricao,
        preco: sobConsulta ? 0 : parseFloat(preco.replace(",", ".")),
        sobConsulta,
        imagemUrl,
        fichaUrl,
        vendedor_id: auth.currentUser.uid,
        vendedor_email: auth.currentUser.email,
        data_cadastro: new Date()
      });

      alert("Produto B2B catalogado com sucesso!");
      router.push("/dashboard");

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
                <input type="text" required value={nome} onChange={(e) => setNome(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Sensor de Barreira, Tubo Galvanizado..." />
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
                <input type="text" value={marca} onChange={(e) => setMarca(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: 3M, Makita, Gerdau..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Norma / CA (Opcional)</label>
                <input type="text" value={norma} onChange={(e) => setNorma(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none" placeholder="Ex: Adequado à NR12, CA 12345" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unidade de Venda</label>
                <select value={unidade} onChange={(e) => setUnidade(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none bg-white">
                  <option value="UN">Unidade (UN)</option>
                  <option value="CX">Caixa (CX)</option>
                  <option value="KG">Quilograma (KG)</option>
                  <option value="TON">Tonelada (TON)</option>
                  <option value="M">Metro Linear (M)</option>
                  <option value="M2">Metro Quadrado (M²)</option>
                  <option value="HR">Hora Técnica (HR)</option>
                </select>
              </div>
              <div className="md:col-span-3">
                <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Técnica Detalhada *</label>
                <textarea rows={4} required value={descricao} onChange={(e) => setDescricao(e.target.value)} className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none resize-none" placeholder="Descreva dimensões, voltagem, carga suportada, materiais de fabricação..." />
              </div>
            </div>
          </div>

          {/* SEÇÃO 3: Preço e Mídia */}
          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider mb-4">3. Comercial e Anexos</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
                  <input 
                    type="number" step="0.01" value={preco} onChange={(e) => setPreco(e.target.value)} disabled={sobConsulta}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none disabled:bg-gray-200 disabled:text-gray-400" 
                    placeholder="0.00" 
                  />
                </div>
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={sobConsulta} onChange={(e) => setSobConsulta(e.target.checked)} className="w-5 h-5 text-orange-600 border-gray-300 rounded focus:ring-orange-500" />
                  <span className="text-sm font-medium text-slate-700">Ocultar valor (Preço Sob Consulta)</span>
                </label>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Foto Principal (Obrigatório)</label>
                  <input type="file" accept="image/*" required onChange={(e) => setImagem(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Ficha Técnica / Manual (PDF Opcional)</label>
                  <input type="file" accept=".pdf" onChange={(e) => setFichaTecnica(e.target.files ? e.target.files[0] : null)} className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-slate-100 file:text-slate-700 hover:file:bg-slate-200" />
                </div>
              </div>

            </div>
          </div>

          <div className="pt-4 flex justify-end">
            <button type="submit" disabled={carregando} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-lg hover:bg-slate-800 transition shadow-xl disabled:bg-gray-400 text-lg">
              {carregando ? "Processando e Salvando..." : "Publicar no Catálogo B2B"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}