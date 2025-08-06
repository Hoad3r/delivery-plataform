import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { updateDoc, doc, getDoc } from 'firebase/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { cupomId, userId } = body;

    if (!cupomId) {
      return NextResponse.json({ error: 'ID do cupom é obrigatório' }, { status: 400 });
    }

    // Buscar cupom
    const cupomRef = doc(db, 'cupons', cupomId);
    const cupomDoc = await getDoc(cupomRef);

    if (!cupomDoc.exists()) {
      return NextResponse.json({ error: 'Cupom não encontrado' }, { status: 404 });
    }

    const cupom = cupomDoc.data();

    // Verificar se ainda pode ser usado
    if (cupom.usosTotais >= cupom.limiteTotal) {
      return NextResponse.json({ error: 'Cupom esgotado' }, { status: 400 });
    }

    // Atualizar contadores
    const updates: Record<string, unknown> = {
      usosTotais: (cupom.usosTotais || 0) + 1,
      updatedAt: new Date().toISOString()
    };

    // Se há usuário autenticado, atualizar contador por usuário
    if (userId) {
      const usosPorUsuario = cupom.usosPorUsuario || {};
      usosPorUsuario[userId] = (usosPorUsuario[userId] || 0) + 1;
      updates.usosPorUsuario = usosPorUsuario;
    }

    await updateDoc(cupomRef, updates as { [x: string]: any });

    return NextResponse.json({
      message: 'Cupom aplicado com sucesso',
      cupom: {
        id: cupomId,
        codigo: cupom.codigo,
        tipo: cupom.tipo,
        valor: cupom.valor
      }
    });

  } catch (error) {
    console.error('Erro ao aplicar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 