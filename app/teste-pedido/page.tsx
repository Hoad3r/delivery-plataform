'use client';

import { useState } from 'react';
import { adicionarPedido } from '@/lib/pedidos';

export default function TestePedido() {
  const [loading, setLoading] = useState(false);
  const [mensagem, setMensagem] = useState('');
  const [logs, setLogs] = useState<string[]>([]);

  const adicionarLog = (log: string) => {
    setLogs(prev => [...prev, `${new Date().toLocaleTimeString()} - ${log}`]);
  };

  const testarPedido = async () => {
    setLoading(true);
    setLogs([]);
    adicionarLog('Iniciando processo de adição de pedido...');

    try {
      adicionarLog('Criando objeto do pedido...');
      const pedidoTeste = {
        usuarioId: "usuario-teste-123",
        itens: [
          {
            id: "1",
            nome: "X-Burger",
            quantidade: 2,
            preco: 25.90
          },
          {
            id: "2",
            nome: "Batata Frita",
            quantidade: 1,
            preco: 15.90
          }
        ],
        total: 67.70,
        status: "pendente" as const,
        endereco: {
          rua: "Rua Teste",
          numero: "123",
          bairro: "Centro",
          cidade: "São Paulo",
          estado: "SP",
          cep: "01234-567"
        },
        observacoes: "Pedido de teste"
      };
      adicionarLog('Objeto do pedido criado com sucesso');

      adicionarLog('Enviando pedido para o Firestore...');
      const resultado = await adicionarPedido(pedidoTeste);
      adicionarLog(`Pedido adicionado com sucesso! ID: ${resultado.id}`);
      
      setMensagem(`Pedido adicionado com sucesso! ID: ${resultado.id}`);
    } catch (error) {
      const erro = error instanceof Error ? error.message : 'Erro desconhecido';
      adicionarLog(`ERRO: ${erro}`);
      setMensagem(`Erro ao adicionar pedido: ${erro}`);
    } finally {
      setLoading(false);
      adicionarLog('Processo finalizado');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-end">
      <div className="w-full max-w-2xl mx-auto bg-white shadow-md">
        <div className="p-4 space-y-4">
          <div className="flex justify-center">
            <button
              onClick={testarPedido}
              disabled={loading}
              className={`
                px-6 py-2 rounded-lg font-medium text-white
                ${loading 
                  ? 'bg-gray-400 cursor-not-allowed' 
                  : 'bg-blue-500 hover:bg-blue-600 transition-colors'
                }
                shadow-md hover:shadow-lg transform hover:-translate-y-0.5
                transition-all duration-200
              `}
            >
              {loading ? 'Adicionando...' : 'Adicionar Pedido de Teste'}
            </button>
          </div>

          {mensagem && (
            <div className={`
              p-3 rounded-lg
              ${mensagem.includes('sucesso') 
                ? 'bg-green-100 text-green-700 border border-green-200' 
                : 'bg-red-100 text-red-700 border border-red-200'
              }
            `}>
              {mensagem}
            </div>
          )}

          {logs.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold mb-2 text-gray-700">Logs do Processo:</h2>
              <div className="bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto">
                {logs.map((log, index) => (
                  <div 
                    key={index} 
                    className="text-sm font-mono py-1 border-b border-gray-200 last:border-0"
                  >
                    {log}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 