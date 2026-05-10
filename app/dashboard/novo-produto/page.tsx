"use client";

import { useState } from "react";
import { auth, db, storage } from "@/firebase/config";
import { collection, addDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { useRouter } from "next/navigation";

export default function NovoProduto() {
  const [nome, setNome] = useState("");
  const [categoria, setCategoria] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");
  const [imagem, setImagem] = useState<File | null>(null);
  const [carregando, setCarregando] = useState(false);
  
  const router = useRouter();

  const handleSalvarProduto = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Verifica se o usuário está logado
    if (!auth.currentUser) {
      alert("Sessão expirada. Faça login novamente.");
      return;
    }

    setCarregando(true);

    try {
      let imagemUrl = "";

      // 1. Se houver imagem, faz o upload pro Storage primeiro
      if (imagem) {
        const imagemRef = ref(storage, `produtos/${auth.currentUser.uid}/${Date.now()}_${imagem.name}`);
        await uploadBytes(imagemRef, imagem);
        imagemUrl = await getDownloadURL(imagemRef);
      }

      // 2. Salva os dados no Firestore (Banco de Dados)
      await addDoc(collection(db, "produtos"), {
        nome,
        categoria,
        preco: parseFloat(preco.replace(",", ".")), // Garante que é número
        descricao,
        imagemUrl,
        vendedor_id: auth.currentUser.uid, // O ID único da empresa
        vendedor_email: auth.currentUser.email,
        data_cadastro: new Date()
      });

      alert("Produto cadastrado com sucesso!");
      router.push("/dashboard"); // Volta pro painel

    } catch (error) {
      console.error("Erro ao salvar produto:", error);
      alert("Ocorreu um erro ao cadastrar o produto.");
    } finally {
      setCarregando(false);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm border border-gray-100 p-8">
        
        <div className="flex justify-between items-center mb-8 border-b pb-4">
          <h1 className="text-2xl font-bold text-slate-900">Cadastrar Novo Produto</h1>
          <button onClick={() => router.back()} className="text-gray-500 hover:text-orange-600 transition">
            Voltar
          </button>
        </div>

        <form onSubmit={handleSalvarProduto} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Nome do Produto / Serviço</label>
              <input 
                type="text" required value={nome} onChange={(e) => setNome(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="Ex: Sensor de Segurança NR12, Andaime Tubular..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Categoria</label>
              <select 
                required value={categoria} onChange={(e) => setCategoria(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none bg-white"
              >
                <option value="">Selecione...</option>
                <option value="EPI">EPI e Segurança</option>
                <option value="Maquinario">Maquinário</option>
                <option value="Materiais">Materiais de Construção</option>
                <option value="Servicos">Serviços / Mão de Obra</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Preço Base (R$)</label>
              <input 
                type="number" step="0.01" required value={preco} onChange={(e) => setPreco(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none"
                placeholder="0.00"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Foto do Produto</label>
              <input 
                type="file" accept="image/*" onChange={(e) => setImagem(e.target.files ? e.target.files[0] : null)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-orange-50 file:text-orange-700 hover:file:bg-orange-100"
              />
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">Descrição Técnica</label>
              <textarea 
                rows={4} required value={descricao} onChange={(e) => setDescricao(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 outline-none resize-none"
                placeholder="Detalhes, normas técnicas (ex: NR18, NR12), dimensões..."
              />
            </div>
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end">
            <button 
              type="submit" disabled={carregando}
              className="px-8 py-3 bg-slate-900 text-white font-medium rounded-md hover:bg-slate-800 transition disabled:bg-gray-400"
            >
              {carregando ? "Salvando..." : "Publicar Produto"}
            </button>
          </div>
        </form>

      </div>
    </main>
  );
}