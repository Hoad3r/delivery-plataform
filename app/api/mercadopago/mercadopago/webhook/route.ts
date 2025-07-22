import { NextResponse } from 'next/server';
import { db } from '@/lib/firebase';
import { doc, updateDoc, getDocs, query, collection, where } from 'firebase/firestore';
import nodemailer from 'nodemailer';

// Função para baixar estoque dos itens do pedido
async function decreaseStockForOrder(orderItems: Array<{ id: string; quantity?: number }>) {
  for (const item of orderItems) {
    const dishesRef = collection(db, 'dishes');
    const q = query(dishesRef, where('id', '==', item.id));
    const dishSnapshot = await getDocs(q);
    if (!dishSnapshot.empty) {
      const dishDoc = dishSnapshot.docs[0];
      const dishData = dishDoc.data();
      const currentStock = dishData.availableQuantity || 0;
      const newStock = Math.max(0, currentStock - (item.quantity || 1));
      await updateDoc(doc(db, 'dishes', dishDoc.id), {
        availableQuantity: newStock,
        isAvailable: newStock > 0
      });
    }
  }
}

// Função para enviar e-mail
async function sendEmail({ to, subject, html }: { to: string; subject: string; html: string }) {
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: 'nossacozinhajp@gmail.com',
      pass: 'wiut icud vvhc iepr'
    }
  });
  await transporter.sendMail({
    from: 'Nossa Cozinha <nossacozinhajp@gmail.com>',
    to,
    subject,
    html
  });
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    console.log('[WEBHOOK] Recebido:', JSON.stringify(body));
    if (body.type === 'payment' && body.data?.id) {
      const paymentId = body.data.id;
      const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
        headers: { Authorization: `Bearer ${accessToken}` }
      });
      const payment = await res.json();
      console.log('[WEBHOOK] Detalhes do pagamento:', payment);
      if (payment.status === 'approved') {
        const orderId = payment.external_reference;
        const ordersRef = collection(db, 'orders');
        const q = query(ordersRef, where('id', '==', orderId));
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          const orderDoc = snapshot.docs[0];
          const orderData = orderDoc.data();
          await updateDoc(doc(db, 'orders', orderDoc.id), {
            status: 'pending',
            'payment.status': 'paid',
            'payment.approvedAt': new Date().toISOString(),
            updatedAt: new Date().toISOString(),
            [`statusHistory.pending`]: {
              timestamp: new Date().toISOString(),
              note: 'Pagamento aprovado via webhook'
            }
          });
          // Baixar estoque
          if (orderData.items) {
            await decreaseStockForOrder(orderData.items);
          }
          // Enviar e-mails
          try {
            if (orderData.user?.email) {
              await sendEmail({
                to: orderData.user.email,
                subject: `🎉 Pedido #${orderData.id} Pago - Aguardando Confirmação`,
                html: `<div style='font-family: Arial, sans-serif;'><h2>Pagamento confirmado!</h2><p>Seu pedido #${orderData.id} foi pago e está aguardando confirmação do restaurante.</p></div>`
              });
            }
            await sendEmail({
              to: 'nossacozinhajp@gmail.com',
              subject: `🚨 PEDIDO PAGO - #${orderData.id} - PREPARAR IMEDIATAMENTE`,
              html: `<div style='font-family: Arial, sans-serif;'><h2>Pagamento confirmado!</h2><p>Pedido #${orderData.id} pago. Preparar imediatamente.</p></div>`
            });
          } catch (emailError) {
            console.error('[WEBHOOK] Erro ao enviar e-mail:', emailError);
          }
          console.log('[WEBHOOK] Pedido atualizado, estoque baixado e e-mails enviados.');
        } else {
          console.warn('[WEBHOOK] Pedido não encontrado para orderId:', orderId);
        }
      } else {
        console.log('[WEBHOOK] Pagamento não aprovado, status:', payment.status);
      }
    }
    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('[WEBHOOK] Erro geral:', error);
    return NextResponse.json({ error: 'Erro no webhook' }, { status: 500 });
  }
} 