"use client";

import { useEffect, useState } from "react";
import { auth, db, storage } from "@/firebase/config";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { onAuthStateChanged } from "firebase/auth";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function EditarProduto() {
  const { id } = useParams();
  const router = useRouter();
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);

  // Estados do Formulário
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [marca, setMarca] = useState("");
  const [unidade, setUnidade] = useState("UN");
  const [norma, setNorma] = useState("");
  const [descricao, setDescricao] = useState("");
  const [preco, setPreco] = useState("");
  const [sobConsulta, setSobConsulta] = useState(false);
  
  // Preços por Lote/Volume
  const [faixasAtacado, setFaixasAtacado] = useState<{ qtd: string; preco: string }[]>([]);
  
  const [novaImagem, setNovaImagem] = useState<File | null>(null);
  const [imagemAtual, setImagemAtual] = useState("");

  // --- NOVO MOTOR DE BUSCA (KEYWORDS 2.0) ---
  const gerarKeywords = (nome: string, categoria: string, marca: string) => {
    const keywords = new Set<string>();
    
    const tratarTexto = (texto: string) => 
      texto.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").trim();

    const n = tratarTexto(nome);
    const c = tratarTexto(categoria);
    const m = tratarTexto(marca);

    const adicionarTermos = (texto: string) => {
      if (!texto) return;
      
      // 1. Frase completa (Ex: "playstation 5")
      keywords.add(texto);

      // 2. Prefixos da frase (Busca instantânea: pl, pla, play...)
      for (let i = 2; i <= texto.length; i++) {
        keywords.add(texto.substring(0, i));
      }

      // 3. Palavras individuais e seus prefixos
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

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        buscarProduto(user.uid);
      } else {
        router.push("/login");
      }
    });
    return () => unsubscribe();
  }, [id]);

  const buscarProduto = async (uid: string) => {
    try {
      const docRef = doc(db, "produtos", id as string);
      const docSnap = await getDoc(docRef);
      
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (uid !== data.vendedor_id) {
          alert("Acesso negado.");
          router.push("/dashboard");
          return;
        }

        setNome(data.nome || "");
        setCategoria(data.categoria || "");
        setMarca(data.marca || "");
        setUnidade(data.unidade || "UN");
        setNorma(data.norma || "");
        setDescricao(data.descricao || "");
        setPreco(data.preco ? data.preco.toString() : "");
        setSobConsulta(data.sobConsulta || false);
        setImagemAtual(data.imagemUrl || "");
        
        if (data.faixasAtacado) {
          const faixasTratadas = data.faixasAtacado.map((f: any) => ({
            qtd: f.qtd.toString(),
            preco: f.preco.toString()
          }));
          setFaixasAtacado(faixasTratadas);
        }
      }
    } catch (error) {
      console.error(error);
    } finally {
      setCarregando(false);
    }
  };

  const adicionarFaixa = () => setFaixasAtacado([...faixasAtacado, { qtd: "", preco: "" }]);
  
  const atualizarFaixa = (index: number, campo: "qtd" | "preco", valor: string) => {
    const novasFaixas = [...faixasAtacado];
    novasFaixas[index][campo] = valor;
    setFaixasAtacado(novasFaixas);
  };

  const removerFaixa = (index: number) => setFaixasAtacado(faixasAtacado.filter((_, i) => i !== index));

  const handleAtualizarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    if (!sobConsulta && (!preco || parseFloat(preco) <= 0)) {
      return alert("Informe um preço base válido.");
    }

    if (novaImagem && novaImagem.size > 2 * 1024 * 1024) {
      return alert("A imagem não pode ter mais de 2MB.");
    }

    setSalvando(true);

    try {
      let imagemUrl = imagemAtual;
      if (novaImagem) {
        const imagemRef = ref(storage, `produtos/${auth.currentUser.uid}/${Date.now()}_${novaImagem.name}`);
        await uploadBytes(imagemRef, novaImagem);
        imagemUrl = await getDownloadURL(imagemRef);
      }

      const faixasFormatadas = faixasAtacado
        .filter(f => f.qtd && f.preco)
        .map(f => ({
          qtd: parseInt(f.qtd, 10),
          preco: parseFloat(f.preco.replace(",", "."))
        }))
        .sort((a, b) => a.qtd - b.qtd);

      // GERAR NOVAS KEYWORDS COM O MOTOR 2.0
      const keywords = gerarKeywords(nome, categoria, marca);

      await updateDoc(doc(db, "produtos", id as string), {
        nome, 
        categoria, 
        marca, 
        unidade, 
        norma, 
        descricao,
        preco: sobConsulta ? 0 : parseFloat(preco.replace(",", ".")),
        sobConsulta,
        faixasAtacado: sobConsulta ? [] : faixasFormatadas,
        imagemUrl,
        searchKeywords: keywords, // <--- ATUALIZAÇÃO DO ÍNDICE DE BUSCA
        data_atualizacao: new Date()
      });

      alert("Alterações salvas e produto reindexado!");
      router.push("/dashboard/meu-catalogo");
    } catch (error) {
      alert("Erro ao atualizar.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <div className="p-20 text-center">Carregando dados...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="max-w-4xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        <header className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Editar Item Técnico</h1>
          <Link href="/dashboard/meu-catalogo" className="text-gray-400 hover:text-slate-900 transition font-medium">Cancelar</Link>
        </header>

        <form onSubmit={handleAtualizarProduto} className="space-y-8">
          
          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="md:col-span-2">
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome do Equipamento</label>
              <input type="text" required value={nome} onChange={e => setNome(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-slate-900" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Categoria</label>
              <select value={categoria} onChange={e => setCategoria(e.target.value)} className="w-full px-4 py-2 border rounded-md bg-white text-slate-900">
                <option value="EPI">EPIs e Segurança</option>
                <option value="Maquinario">Máquinas e Equipamentos</option>
                <option value="Estruturas">Estruturas e Andaimes</option>
                <option value="Materiais">Materiais Brutos</option>
                <option value="Servicos">Engenharia e Serviços</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Marca / Fabricante</label>
              <input type="text" value={marca} onChange={e => setMarca(e.target.value)} className="w-full px-4 py-2 border rounded-md focus:ring-2 focus:ring-orange-500 outline-none text-slate-900" />
            </div>
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <h2 className="text-xs font-bold text-gray-400 uppercase mb-4 tracking-widest">Precificação e Atacado</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Preço Base Unitário</label>
                <input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} disabled={sobConsulta} className="w-full px-4 py-2 border rounded-md disabled:bg-gray-200 text-slate-900" />
              </div>
              <div className="flex items-center pt-5">
                <label className="flex items-center space-x-2 cursor-pointer">
                  <input type="checkbox" checked={sobConsulta} onChange={e => setSobConsulta(e.target.checked)} className="w-5 h-5 text-orange-600 rounded" />
                  <span className="text-sm font-bold text-slate-700">Preço Sob Consulta</span>
                </label>
              </div>
            </div>

            {!sobConsulta && (
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h3 className="text-sm font-bold text-slate-800">Regras de Volume (Lotes)</h3>
                  <button type="button" onClick={adicionarFaixa} className="text-xs bg-slate-900 text-white px-3 py-1.5 rounded hover:bg-slate-800 transition">+ Adicionar Faixa</button>
                </div>
                {faixasAtacado.map((faixa, index) => (
                  <div key={index} className="flex items-center gap-3 bg-white p-3 rounded border border-gray-200">
                    <input type="number" value={faixa.qtd} onChange={e => atualizarFaixa(index, "qtd", e.target.value)} placeholder="Qtd mínima" className="w-full px-3 py-1.5 border rounded text-sm text-slate-900" />
                    <input type="number" step="0.01" value={faixa.preco} onChange={e => atualizarFaixa(index, "preco", e.target.value)} placeholder="Preço unitário" className="w-full px-3 py-1.5 border rounded text-sm text-slate-900" />
                    <button type="button" onClick={() => removerFaixa(index)} className="text-red-400 hover:text-red-600 font-bold px-2">✕</button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-slate-50 p-6 rounded-lg border border-gray-100">
            <label className="block text-xs font-bold text-gray-500 uppercase mb-2">Imagem do Produto</label>
            <div className="flex items-center gap-4">
              {imagemAtual && !novaImagem && <img src={imagemAtual} className="h-16 w-16 object-cover rounded border" alt="Atual" />}
              <input type="file" accept="image/*" onChange={e => setNovaImagem(e.target.files ? e.target.files[0] : null)} className="flex-1 text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-orange-50 file:text-orange-700" />
            </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={salvando} className="px-12 py-4 bg-orange-600 text-white font-bold rounded-lg hover:bg-orange-700 transition shadow-lg disabled:bg-gray-400">
              {salvando ? "Salvando..." : "Salvar Alterações Técnicas"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}