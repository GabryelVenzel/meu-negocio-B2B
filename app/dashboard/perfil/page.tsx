"use client";

import { useState, useEffect } from "react";
import { auth, db } from "@/firebase/config";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { useRouter } from "next/navigation";

export default function PerfilEmpresa() {
  const [nomeEmpresa, setNomeEmpresa] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [descricao, setDescricao] = useState("");
  const [carregando, setCarregando] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [buscandoCnpj, setBuscandoCnpj] = useState(false); // Novo estado
  
  const router = useRouter();

  useEffect(() => {
    const carregarDados = async () => {
      if (auth.currentUser) {
        const docRef = doc(db, "vendedores", auth.currentUser.uid);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          const dados = docSnap.data();
          setNomeEmpresa(dados.nomeEmpresa || "");
          setCnpj(dados.cnpj || "");
          setDescricao(dados.descricao || "");
        }
        setCarregando(false);
      }
    };
    carregarDados();
  }, []);

  // Nova função: Consulta o CNPJ na API pública
  const consultarCNPJ = async () => {
    const cnpjLimpo = cnpj.replace(/\D/g, ""); // Remove pontos e traços
    
    if (cnpjLimpo.length !== 14) {
      alert("Por favor, digite um CNPJ válido com 14 números.");
      return;
    }

    setBuscandoCnpj(true);
    try {
      const response = await fetch(`https://brasilapi.com.br/api/cnpj/v1/${cnpjLimpo}`);
      
      if (!response.ok) {
        throw new Error("CNPJ não encontrado na Receita Federal");
      }

      const data = await response.json();
      
      // Auto-preenche os dados!
      setNomeEmpresa(data.razao_social);
      
      // Bônus: cria uma bio automática básica se estiver vazia
      if (!descricao) {
        setDescricao(`Empresa localizada em ${data.municipio} - ${data.uf}, atuando no setor de ${data.cnae_fiscal_descricao}.`);
      }
      
      alert("CNPJ validado e dados preenchidos com sucesso!");
    } catch (error: any) {
      alert(error.message || "Erro ao consultar a API.");
    } finally {
      setBuscandoCnpj(false);
    }
  };

  const handleSalvarPerfil = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;

    setSalvando(true);
    try {
      await setDoc(doc(db, "vendedores", auth.currentUser.uid), {
        nomeEmpresa,
        cnpj,
        descricao,
        email: auth.currentUser.email,
        atualizadoEm: new Date()
      }, { merge: true });
      alert("Perfil atualizado com sucesso!");
    } catch (error) {
      console.error(error);
      alert("Erro ao salvar perfil.");
    } finally {
      setSalvando(false);
    }
  };

  if (carregando) return <div className="p-20 text-center">Carregando perfil...</div>;

  return (
    <main className="min-h-screen bg-gray-50 p-8 flex justify-center">
      <div className="max-w-2xl w-full bg-white rounded-xl shadow-sm p-8 border border-gray-100">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Perfil da Empresa</h1>
        <p className="text-gray-500 text-sm mb-6">Valide seu CNPJ para transmitir segurança aos compradores.</p>
        
        <form onSubmit={handleSalvarPerfil} className="space-y-6">
          
          {/* Campo CNPJ atualizado com o botão de consulta */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">CNPJ da Empresa</label>
            <div className="flex gap-2">
              <input 
                type="text" required value={cnpj} onChange={(e) => setCnpj(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="Apenas números ou formato 00.000.000/0000-00"
              />
              <button 
                type="button" 
                onClick={consultarCNPJ}
                disabled={buscandoCnpj}
                className="px-4 py-2 bg-slate-900 text-white rounded-md hover:bg-slate-800 transition disabled:bg-gray-400 font-medium whitespace-nowrap"
              >
                {buscandoCnpj ? "Consultando..." : "Validar CNPJ"}
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Razão Social / Nome Fantasia</label>
            <input 
              type="text" required value={nomeEmpresa} onChange={(e) => setNomeEmpresa(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 bg-gray-50"
              placeholder="Auto-preenchido após validação do CNPJ"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Sobre a Empresa (Bio)</label>
            <textarea 
              rows={4} value={descricao} onChange={(e) => setDescricao(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-orange-500 resize-none"
              placeholder="Descreva sua especialidade, certificações NR, tempo de mercado..."
            />
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-gray-100">
            <button type="button" onClick={() => router.back()} className="text-gray-500 hover:text-gray-800 font-medium">Cancelar</button>
            <button 
              type="submit" disabled={salvando}
              className="px-8 py-3 bg-orange-600 text-white font-bold rounded-md hover:bg-orange-700 transition shadow-md"
            >
              {salvando ? "Salvando..." : "Salvar Perfil Seguro"}
            </button>
          </div>
        </form>
      </div>
    </main>
  );
}