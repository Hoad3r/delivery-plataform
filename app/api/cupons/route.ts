import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { NextResponse, NextRequest } from 'next/server';

const cuponsCollection = collection(db, 'cupons');

export async function GET(request: NextRequest) {
  // Suporte a busca por código
  const { searchParams } = request.nextUrl;
  const codigo = searchParams.get('codigo');
  if (codigo) {
    const snapshot = await getDocs(cuponsCollection);
    const cupons: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    const filtrado = cupons.filter(c => c.codigo && c.codigo.toUpperCase() === codigo.toUpperCase());
    return NextResponse.json(filtrado);
  }
  const snapshot = await getDocs(cuponsCollection);
  const cupons: any[] = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
  return NextResponse.json(cupons);
}

export async function POST(request: Request) {
  const data = await request.json();
  const docRef = await addDoc(cuponsCollection, data);
  return NextResponse.json({ id: docRef.id });
}

export async function PUT(request: Request) {
  const { id, ...data } = await request.json();
  const docRef = doc(db, 'cupons', id);
  // Permitir atualizar o campo 'codigo' também
  await updateDoc(docRef, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const docRef = doc(db, 'cupons', id);
  await deleteDoc(docRef);
  return NextResponse.json({ success: true });
} 