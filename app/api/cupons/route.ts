import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { collection, getDocs, addDoc, deleteDoc, doc, updateDoc, query, where } from 'firebase/firestore';

export async function GET() {
  try {
    const cuponsRef = collection(db, 'cupons');
    const snapshot = await getDocs(cuponsRef);
    const cupons = snapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    return NextResponse.json(cupons);
  } catch (error) {
    console.error('Erro ao buscar cupons:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    console.log('Dados recebidos:', body);
    
    const { codigo, tipo, valor, ativo, limitePorUsuario, limiteTotal, valorMinimo, dataExpiracao } = body;

    // Validações
    if (!codigo || !tipo) {
      console.log('Erro: Código ou tipo não fornecidos');
      return NextResponse.json({ error: 'Código e tipo são obrigatórios' }, { status: 400 });
    }

    // Verificar se o código já existe
    const cuponsRef = collection(db, 'cupons');
    const q = query(cuponsRef, where('codigo', '==', codigo.toUpperCase()));
    const existingCupons = await getDocs(q);
    
    if (!existingCupons.empty) {
      console.log('Erro: Código já existe');
      return NextResponse.json({ error: 'Código de cupom já existe' }, { status: 400 });
    }

    // Validar tipo de cupom
    const tiposValidos = ['frete_gratis', 'marmita_gratis', 'desconto'];
    if (!tiposValidos.includes(tipo)) {
      console.log('Erro: Tipo inválido:', tipo);
      return NextResponse.json({ error: 'Tipo de cupom inválido' }, { status: 400 });
    }

    // Validar valor para cupons de desconto
    if (tipo === 'desconto' && (!valor || valor <= 0)) {
      console.log('Erro: Valor inválido para desconto');
      return NextResponse.json({ error: 'Valor é obrigatório para cupons de desconto' }, { status: 400 });
    }

    // Criar cupom
    const cupomData: any = {
      codigo: codigo.toUpperCase(),
      tipo,
      valor: tipo === 'desconto' ? Number(valor) || 0 : 0, // Sempre definir valor, 0 se não for desconto
      ativo: Boolean(ativo),
      limitePorUsuario: Number(limitePorUsuario) || 1,
      limiteTotal: Number(limiteTotal) || 100,
      valorMinimo: Number(valorMinimo) || 0,
      usosTotais: 0,
      usosPorUsuario: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    // Adicionar data de expiração apenas se fornecida
    if (dataExpiracao) {
      cupomData.dataExpiracao = dataExpiracao;
    }

    console.log('Dados do cupom a serem salvos:', cupomData);

    const docRef = await addDoc(collection(db, 'cupons'), cupomData);
    
    console.log('Cupom criado com sucesso, ID:', docRef.id);
    
    return NextResponse.json({ 
      id: docRef.id, 
      ...cupomData,
      message: 'Cupom criado com sucesso' 
    });

  } catch (error) {
    console.error('Erro detalhado ao criar cupom:', error);
    return NextResponse.json({ 
      error: 'Erro interno do servidor',
      details: error instanceof Error ? error.message : 'Erro desconhecido'
    }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, ativo } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom é obrigatório' }, { status: 400 });
    }

    const cupomRef = doc(db, 'cupons', id);
    await updateDoc(cupomRef, {
      ativo: Boolean(ativo),
      updatedAt: new Date().toISOString()
    });

    return NextResponse.json({ message: 'Cupom atualizado com sucesso' });

  } catch (error) {
    console.error('Erro ao atualizar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID do cupom é obrigatório' }, { status: 400 });
    }

    const cupomRef = doc(db, 'cupons', id);
    await deleteDoc(cupomRef);

    return NextResponse.json({ message: 'Cupom deletado com sucesso' });

  } catch (error) {
    console.error('Erro ao deletar cupom:', error);
    return NextResponse.json({ error: 'Erro interno do servidor' }, { status: 500 });
  }
} 