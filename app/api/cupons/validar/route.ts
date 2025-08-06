import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, query, where } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { codigo, userId, valorPedido, quantidadeItens } = body;

    if (!codigo) {
      return NextResponse.json({ error: 'Código do cupom é obrigatório' }, { status: 400 });
    }

    // Buscar cupom pelo código
    const cuponsRef = collection(db, 'cupons');
    const q = query(cuponsRef, where('codigo', '==', codigo.toUpperCase()));
    const snapshot = await getDocs(q);

    if (snapshot.empty) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    const cupomDoc = snapshot.docs[0];
    const cupom = { id: cupomDoc.id, ...cupomDoc.data() } as {
      id: string;
      codigo: string;
      tipo: string;
      valor?: number;
      ativo: boolean;
      dataExpiracao?: string;
      usosTotais: number;
      limiteTotal: number;
      valorMinimo?: number;
      quantidadeMinima?: number;
      limitePorUsuario: number;
      usosPorUsuario?: Record<string, number>;
    };

    // Validações
    const validacoes = [];

    // 1. Verificar se está ativo
    if (!cupom.ativo) {
      validacoes.push('Cupom inativo');
    }

    // 2. Verificar data de expiração
    if (cupom.dataExpiracao) {
      const dataExpiracao = new Date(cupom.dataExpiracao);
      const hoje = new Date();
      
      // Definir o final do dia da data de expiração (23:59:59.999)
      const dataExpiracaoFinal = new Date(dataExpiracao);
      dataExpiracaoFinal.setHours(23, 59, 59, 999);
      
      if (hoje > dataExpiracaoFinal) {
        validacoes.push('Cupom expirado');
      }
    }

    // 3. Verificar limite total
    if (cupom.usosTotais >= cupom.limiteTotal) {
      validacoes.push('Cupom esgotado (limite total atingido)');
    }

    // 4. Verificar valor mínimo
    if (cupom.valorMinimo && valorPedido < cupom.valorMinimo) {
      validacoes.push(`Valor mínimo não atingido (R$ ${cupom.valorMinimo})`);
    }

    // 5. Verificar quantidade mínima para cupons de marmita grátis
    if (cupom.tipo === 'marmita_gratis' && cupom.quantidadeMinima && quantidadeItens < cupom.quantidadeMinima) {
      validacoes.push(`Quantidade mínima não atingida (${cupom.quantidadeMinima} itens)`);
    }

    // 6. Verificar limite por usuário (se autenticado)
    if (userId) {
      const usosDoUsuario = cupom.usosPorUsuario?.[userId] || 0;
      if (usosDoUsuario >= cupom.limitePorUsuario) {
        validacoes.push('Limite de uso por usuário atingido');
      }
    }

    // Se há validações que falharam
    if (validacoes.length > 0) {
      return NextResponse.json({ 
        error: 'Cupom inválido',
        detalhes: validacoes 
      }, { status: 400 });
    }

    // Cupom válido - retornar informações
    const cupomInfo = {
      id: cupom.id,
      codigo: cupom.codigo,
      tipo: cupom.tipo,
      valor: cupom.valor || 0,
      valorMinimo: cupom.valorMinimo,
      quantidadeMinima: cupom.quantidadeMinima,
      descricao: getCupomDescricao(cupom.tipo, cupom.valor || 0, cupom.quantidadeMinima),
      usosRestantes: cupom.limiteTotal - cupom.usosTotais,
      usosPorUsuario: userId ? (cupom.limitePorUsuario - (cupom.usosPorUsuario?.[userId] || 0)) : null
    };

    return NextResponse.json({
      cupom: cupomInfo,
      message: 'Cupom válido'
    });

  } catch (error) {
    console.error('Erro ao validar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

function getCupomDescricao(tipo: string, valor: number = 0, quantidadeMinima?: number): string {
  switch (tipo) {
    case 'frete_gratis':
      return 'Frete grátis';
    case 'marmita_gratis':
      if (quantidadeMinima && quantidadeMinima > 1) {
        return `Uma marmita grátis (mín. ${quantidadeMinima} itens)`;
      }
      return 'Uma marmita grátis';
    case 'desconto':
      return `Desconto de R$ ${valor.toFixed(2)}`;
    default:
      return 'Cupom de desconto';
  }
} 