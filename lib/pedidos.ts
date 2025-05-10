import { db } from './firebase';
import { collection, addDoc, getDocs, query, where, orderBy, Timestamp } from 'firebase/firestore';

// Interface para o tipo de pedido
export interface Pedido {
  usuarioId: string;
  itens: {
    id: string;
    nome: string;
    quantidade: number;
    preco: number;
  }[];
  total: number;
  status: 'pendente' | 'preparando' | 'pronto' | 'entregue';
  endereco: {
    rua: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    cep: string;
  };
  observacoes?: string;
  dataPedido: Date;
}

// Função para adicionar um novo pedido
export const adicionarPedido = async (pedido: Omit<Pedido, 'dataPedido'>) => {
  try {
    const pedidoComData = {
      ...pedido,
      dataPedido: Timestamp.now()
    };

    const docRef = await addDoc(collection(db, "pedidos"), pedidoComData);
    return {
      id: docRef.id,
      ...pedidoComData
    };
  } catch (error) {
    console.error("Erro ao adicionar pedido:", error);
    throw error;
  }
};

// Função para buscar pedidos de um usuário
export const buscarPedidosUsuario = async (usuarioId: string) => {
  try {
    const q = query(
      collection(db, "pedidos"),
      where("usuarioId", "==", usuarioId),
      orderBy("dataPedido", "desc")
    );

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error("Erro ao buscar pedidos:", error);
    throw error;
  }
}; 