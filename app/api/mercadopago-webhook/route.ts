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
                html: `
                  <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #f8fafc;">
                    <div style="text-align: center; margin-bottom: 20px;">
                      <h1 style="color: #059669; margin: 0;">PEDIDO PAGO!</h1>
                      <p style="color: #059669; font-size: 18px; font-weight: bold; margin: 5px 0;">Pedido #${orderData.id}</p>
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #059669; margin-bottom: 20px;">
                      <h2 style="color: #1e293b; margin-top: 0;">✅ Pagamento Confirmado</h2>
                      <p style="font-size: 16px; color: #374151;">Seu pagamento foi confirmado com sucesso!</p>
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h3 style="color: #1e293b; margin-top: 0;">📋 Seu Pedido:</h3>
                      <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                        <ul style="list-style: none; padding: 0; margin: 0;">
                          ${(orderData.items || []).map((item: any) => `
                            <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                              <span><strong>${item.quantity}x</strong> ${item.name}</span>
                              <span style="font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                            </li>
                          `).join('')}
                        </ul>
                      </div>
                    </div>
                    <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h3 style="color: #166534; margin-top: 0;">📅 Entrega Agendada</h3>
                      <p style="font-size: 16px; color: #166534; margin: 0;">
                        <strong>Data:</strong> ${orderData.scheduledDate}<br/>
                        <strong>Horário:</strong> ${orderData.scheduledTime}
                      </p>
                    </div>
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h3 style="color: #1e293b; margin-top: 0;">💰 Informações de Pagamento:</h3>
                      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                        <div>
                          <strong>Subtotal:</strong> R$ ${(orderData.payment?.subtotal || 0).toFixed(2)}
                        </div>
                        <div>
                          <strong>Taxa de Entrega:</strong> R$ ${(orderData.payment?.deliveryFee || 0).toFixed(2)}
                        </div>
                        <div>
                          <strong>Total:</strong> R$ ${(orderData.payment?.total || 0).toFixed(2)}
                        </div>
                        <div>
                          <strong>Método:</strong> PIX
                        </div>
                        <div>
                          <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAGO</span>
                        </div>
                        <div>
                          <strong>Entrega:</strong> ${orderData.type === 'delivery' ? 'Entrega' : 'Retirada'}
                        </div>
                      </div>
                    </div>
                    ${orderData.notes ? `
                      <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                        <h3 style="color: #1e293b; margin-top: 0;">📝 Observações:</h3>
                        <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 0;">${orderData.notes}</p>
                      </div>
                    ` : ''}
                    <div style="background-color: #fef3c7; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #f59e0b;">
                      <h3 style="color: #92400e; margin-top: 0;">⏳ AGUARDANDO CONFIRMAÇÃO</h3>
                      <p style="color: #92400e; font-size: 16px; font-weight: bold; margin: 0;">
                        Seu pedido está aguardando o restaurante aceitar!
                      </p>
                      <p style="color: #92400e; font-size: 14px; margin: 5px 0 0 0;">
                        Você receberá uma notificação assim que o pedido for aceito e começar a ser preparado.
                      </p>
                    </div>
                    <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                      <p>Agradecemos a preferência!</p>
                      <p><strong>Nossa Cozinha</strong></p>
                    </div>
                  </div>
                `
              });
            }
            await sendEmail({
              to: 'nossacozinhajp@gmail.com',
              subject: `🚨 PEDIDO PAGO - #${orderData.id} - PREPARAR IMEDIATAMENTE`,
              html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 5px; background-color: #fef2f2;">
                  <div style="text-align: center; margin-bottom: 20px;">
                    <h1 style="color: #dc2626; margin: 0;">🚨 PEDIDO PAGO!</h1>
                    <p style="color: #dc2626; font-size: 18px; font-weight: bold; margin: 5px 0;">Pedido #${orderData.id}</p>
                    <p style="color: #dc2626; font-size: 16px; margin: 5px 0;">PREPARAR IMEDIATAMENTE</p>
                  </div>
                  <div style="background-color: white; padding: 20px; border-radius: 8px; border-left: 4px solid #dc2626; margin-bottom: 20px;">
                    <h2 style="color: #1e293b; margin-top: 0;">✅ Pagamento Confirmado</h2>
                    <p style="font-size: 16px; color: #374151;">O pagamento do pedido foi confirmado e está pronto para preparo!</p>
                  </div>
                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin-top: 0;">📋 Detalhes do Pedido:</h3>
                    <div style="background-color: #f8fafc; padding: 15px; border-radius: 5px;">
                      <ul style="list-style: none; padding: 0; margin: 0;">
                        ${(orderData.items || []).map((item: any) => `
                          <li style="padding: 8px 0; border-bottom: 1px solid #e2e8f0; display: flex; justify-content: space-between;">
                            <span><strong>${item.quantity}x</strong> ${item.name}</span>
                            <span style="font-weight: bold;">R$ ${(item.price * item.quantity).toFixed(2)}</span>
                          </li>
                        `).join('')}
                      </ul>
                    </div>
                  </div>
                  <div style="background-color: #f0fdf4; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #166534; margin-top: 0;">📅 Entrega Agendada</h3>
                    <p style="font-size: 16px; color: #166534; margin: 0;">
                      <strong>Data:</strong> ${orderData.scheduledDate}<br/>
                      <strong>Horário:</strong> ${orderData.scheduledTime}
                    </p>
                  </div>
                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin-top: 0;">💰 Informações de Pagamento:</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div>
                        <strong>Subtotal:</strong> R$ ${(orderData.payment?.subtotal || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Taxa de Entrega:</strong> R$ ${(orderData.payment?.deliveryFee || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Total:</strong> R$ ${(orderData.payment?.total || 0).toFixed(2)}
                      </div>
                      <div>
                        <strong>Método:</strong> PIX
                      </div>
                      <div>
                        <strong>Status:</strong> <span style="color: #059669; font-weight: bold;">PAGO</span>
                      </div>
                      <div>
                        <strong>Entrega:</strong> ${orderData.type === 'delivery' ? 'Entrega' : 'Retirada'}
                      </div>
                    </div>
                  </div>
                  <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                    <h3 style="color: #1e293b; margin-top: 0;">👤 Cliente:</h3>
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px;">
                      <div>
                        <strong>Nome:</strong> ${orderData.user?.name || ''}
                      </div>
                      <div>
                        <strong>Telefone:</strong> ${orderData.user?.phone || ''}
                      </div>
                      ${(orderData.type === 'delivery' && orderData.delivery?.address) ? `
                        <div style="grid-column: 1 / -1;">
                          <strong>Endereço:</strong> ${orderData.delivery.address}
                        </div>
                      ` : ''}
                    </div>
                  </div>
                  ${orderData.notes ? `
                    <div style="background-color: white; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
                      <h3 style="color: #1e293b; margin-top: 0;">📝 Observações:</h3>
                      <p style="background-color: #fef3c7; padding: 10px; border-radius: 5px; margin: 0;">${orderData.notes}</p>
                    </div>
                  ` : ''}
                  <div style="background-color: #dbeafe; padding: 20px; border-radius: 8px; text-align: center; border: 2px solid #3b82f6;">
                    <h3 style="color: #1e40af; margin-top: 0;">🚀 AÇÃO NECESSÁRIA</h3>
                    <p style="color: #1e40af; font-size: 16px; font-weight: bold; margin: 0;">
                      O pedido está pronto para ser preparado!
                    </p>
                    <p style="color: #1e40af; font-size: 14px; margin: 5px 0 0 0;">
                      Tempo estimado: ${orderData.type === 'delivery' ? '45 minutos' : '30 minutos'}
                    </p>
                  </div>
                  <div style="text-align: center; margin-top: 20px; color: #64748b; font-size: 14px;">
                    <p><strong>Nossa Cozinha - Sistema de Pedidos</strong></p>
                  </div>
                </div>
              `
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