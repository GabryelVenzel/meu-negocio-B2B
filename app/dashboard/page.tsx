"use client";

import { useEffect, useState } from "react";
import { collection, addDoc, getDocs, query, orderBy } from "firebase/firestore"; 
import { db } from "../firebase/config";

// Definindo o formato do nosso Produto (TypeScript)
interface Produto {
  id: string;
  nome: string;
  categoria: string;
  empresa_cnpj: string;
  preco: number;
}

export default function Home() {
  const [produtos, setProdutos] = useState<Produto[]>([]);
  const [carregando, setCarregando] = useState(true);

  // Função para buscar os produtos no Firebase
  const carregarProdutos = async () => {
    setCarregando(true);
    try {
      const q = query(collection(db, "produtos"));
      const querySnapshot = await getDocs(q);
      
      const listaProdutos: Produto[] = [];
      querySnapshot.forEach((doc) => {
        listaProdutos.push({ id: doc.id, ...doc.data() } as Produto);
      });
      
      setProdutos(listaProdutos);
    } catch (erro) {
      console.error("Erro ao buscar produtos:", erro);
    } finally {
      setCarregando(false);
    }
  };

  // O useEffect faz com que a busca ocorra automaticamente quando a página carrega
  useEffect(() => {
    carregarProdutos();
  }, []);

  // Mantivemos a função de teste para você poder popular o banco
  const adicionarProdutoTeste = async () => {
    try {
      await addDoc(collection(db, "produtos"), {
        nome: "Capacete de Segurança Classe B",
        categoria: "EPI",
        empresa_cnpj: "12.345.678/0001-99",
        preco: 45.90,
        data_cadastro: new Date()
      });
      alert("Produto B2B gravado! Atualizando a vitrine...");
      carregarProdutos(); // Recarrega a lista após adicionar
    } catch (e) {
      console.error("Erro ao adicionar documento: ", e);
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Cabeçalho */}
        <header className="flex justify-between items-center mb-12">
          <h1 className="text-3xl font-bold text-gray-800">Vitrine B2B</h1>
          <button 
            onClick={adicionarProdutoTeste}
            className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition"
          >
            + Adicionar Produto Teste
          </button>
        </header>

        {/* Área de Listagem dos Produtos */}
        <section>
          <h2 className="text-xl font-semibold text-gray-700 mb-6">Produtos Recentes</h2>
          
          {carregando ? (
            <p className="text-gray-500">Carregando catálogo...</p>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {produtos.map((produto) => (
                <div key={produto.id} className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 hover:shadow-md transition">
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                    {produto.categoria}
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-2">{produto.nome}</h3>
                  <p className="text-gray-500 text-sm mb-4">Vendido por: {produto.empresa_cnpj}</p>
                  
                  <div className="flex justify-between items-center mt-4 pt-4 border-t border-gray-50">
                    <span className="text-xl font-bold text-green-600">
                      R$ {produto.preco.toFixed(2).replace('.', ',')}
                    </span>
                    <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded hover:bg-gray-800 transition">
                      Cotar
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
          
          {!carregando && produtos.length === 0 && (
            <p className="text-gray-500 text-center py-12">Nenhum produto cadastrado ainda.</p>
          )}
        </section>

      </div>
    </main>
  );
}