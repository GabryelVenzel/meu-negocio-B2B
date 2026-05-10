"use client";

import { useState } from "react";
import { createUserWithEmailAndPassword, signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/firebase/config";
import { useRouter } from "next/navigation";

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [erro, setErro] = useState("");
  
  const router = useRouter();

  const handleAutenticacao = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro(""); // Limpa erros anteriores

    try {
      if (isLogin) {
        // Tenta fazer o login
        await signInWithEmailAndPassword(auth, email, senha);
        router.push("/dashboard"); // Redireciona para o painel se der certo
      } else {
        // Tenta criar uma conta nova
        await createUserWithEmailAndPassword(auth, email, senha);
        alert("Conta de empresa criada com sucesso!");
        router.push("/dashboard");
      }
    } catch (error: any) {
      console.error("Erro na autenticação:", error);
      setErro("Falha na autenticação. Verifique seus dados ou se a senha tem pelo menos 6 caracteres.");
    }
  };

  return (
    <main className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-xl shadow-lg p-8 border border-gray-100">
        
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-slate-900 mb-2">
            {isLogin ? "Acesse sua conta" : "Cadastre sua Empresa"}
          </h1>
          <p className="text-gray-500">
            {isLogin ? "Gerencie seus produtos e cotações" : "Junte-se ao maior marketplace B2B"}
          </p>
        </div>

        {erro && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-6 border border-red-200">
            {erro}
          </div>
        )}

        <form onSubmit={handleAutenticacao} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">E-mail corporativo</label>
            <input 
              type="email" 
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-900"
              placeholder="contato@suaempresa.com.br"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Senha</label>
            <input 
              type="password" 
              required
              value={senha}
              onChange={(e) => setSenha(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none transition text-gray-900"
              placeholder="Mínimo 6 caracteres"
            />
          </div>

          <button 
            type="submit"
            className="w-full bg-orange-600 text-white font-medium py-3 rounded-md hover:bg-orange-700 transition duration-200"
          >
            {isLogin ? "Entrar no Painel" : "Criar Conta Grátis"}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button 
            onClick={() => setIsLogin(!isLogin)}
            className="text-sm text-slate-600 hover:text-orange-600 transition font-medium"
          >
            {isLogin ? "Ainda não tem conta? Cadastre-se" : "Já possui uma conta? Faça login"}
          </button>
        </div>
        
      </div>
    </main>
  );
}