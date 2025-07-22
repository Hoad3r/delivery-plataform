import { db } from '../../../lib/firebase';
import { collection, getDocs, addDoc, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { NextResponse } from 'next/server';

const cuponsCollection = collection(db, 'cupons');

export async function GET() {
  const snapshot = await getDocs(cuponsCollection);
  const cupons = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
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
  await updateDoc(docRef, data);
  return NextResponse.json({ success: true });
}

export async function DELETE(request: Request) {
  const { id } = await request.json();
  const docRef = doc(db, 'cupons', id);
  await deleteDoc(docRef);
  return NextResponse.json({ success: true });
} 