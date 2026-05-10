"use client";

import { useEffect, useState } from "react";
import { collection, query, where, getDocs, doc, getDoc } from "firebase/firestore";
import { db } from "@/firebase/config";
import { useParams } from "next/navigation";
import Link from "next/link";

export default function VitrineEmpresa() {
  const { id } = useParams();
  const [empresa, setEmpresa] = useState<any>(null);
  const [produtos, setProdutos] = useState([]);
  const [carregando, setCarregando] = useState(true);

  useEffect(() => {
    const carregarDados = async () => {
      if (!id) return;
      
      // Busca dados da empresa
      const empSnap = await getDoc(doc(db, "vendedores", id as string));
      if (empSnap.exists()) setEmpresa(empSnap.data());

      // Busca produtos daquela empresa
      const q = query(collection(db, "produtos"), where("vendedor_id", "==", id));
      const prodSnap = await getDocs(q);
      const lista: any = prodSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setProdutos(lista);
      
      setCarregando(false);
    };
    carregarDados();
  }, [id]);

  if (carregando) return <div className="p-20 text-center">Carregando vitrine corporativa...</div>;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Banner Superior da Empresa */}
      <section className="bg-slate-900 text-white py-16 px-8">
        <div className="max-w-6xl mx-auto">
          <h1 className="text-4xl font-bold mb-2">{empresa?.nomeEmpresa || "Empresa Parceira"}</h1>
          <p className="text-orange-400 font-medium mb-4">CNPJ: {empresa?.cnpj}</p>
          <p className="max-w-2xl text-gray-300">{empresa?.descricao}</p>
        </div>
      </section>

      {/* Lista de Produtos da Empresa */}
      <section className="max-w-6xl mx-auto p-8">
        <h2 className="text-xl font-bold text-slate-900 mb-8">Catálogo de Produtos</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {produtos.map((produto: any) => (
            <Link href={`/produto/${produto.id}`} key={produto.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition">
              <img src={produto.imagemUrl} className="h-48 w-full object-cover" alt={produto.nome} />
              <div className="p-4">
                <h3 className="font-bold text-slate-900">{produto.nome}</h3>
                <p className="text-orange-600 font-bold mt-2">R$ {produto.preco.toFixed(2)}</p>
              </div>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}