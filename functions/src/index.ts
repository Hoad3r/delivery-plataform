import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import * as nodemailer from 'nodemailer';

admin.initializeApp();

// Configurar o transporter do nodemailer
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: functions.config().email.user,
    pass: functions.config().email.pass
  }
});

// Função para enviar email
async function sendEmail(to: string, subject: string, html: string) {
  const mailOptions = {
    from: 'Nossa Cozinha <noreply@nossacozinha.com>',
    to,
    subject,
    html
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log('Email enviado com sucesso para:', to);
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    throw error;
  }
}

// Templates de email para diferentes status
const emailTemplates = {
  payment_pending: {
    subject: 'Pedido Recebido - Aguardando Pagamento',
    template: (orderId: string, userName: string) => `
      <h2>Olá ${userName}!</h2>
      <p>Seu pedido #${orderId} foi recebido e está aguardando o pagamento.</p>
      <p>Assim que o pagamento for confirmado, começaremos a preparar seu pedido.</p>
    `
  },
  preparing: {
    subject: 'Pedido em Preparo',
    template: (orderId: string, userName: string) => `
      <h2>Olá ${userName}!</h2>
      <p>Seu pedido #${orderId} está sendo preparado!</p>
      <p>Em breve ele estará pronto para entrega.</p>
    `
  },
  delivering: {
    subject: 'Pedido Saiu para Entrega',
    template: (orderId: string, userName: string) => `
      <h2>Olá ${userName}!</h2>
      <p>Seu pedido #${orderId} saiu para entrega!</p>
      <p>Em breve você receberá seu pedido.</p>
    `
  },
  delivered: {
    subject: 'Pedido Entregue',
    template: (orderId: string, userName: string) => `
      <h2>Olá ${userName}!</h2>
      <p>Seu pedido #${orderId} foi entregue!</p>
      <p>Obrigado por escolher a Nossa Cozinha!</p>
    `
  },
  cancelled: {
    subject: 'Pedido Cancelado',
    template: (orderId: string, userName: string) => `
      <h2>Olá ${userName}!</h2>
      <p>Seu pedido #${orderId} foi cancelado.</p>
      <p>Se você tiver alguma dúvida, entre em contato conosco.</p>
    `
  }
};

// Cloud Function para monitorar atualizações de pedidos
export const onOrderStatusChange = functions.firestore
  .onDocumentUpdated('orders/{orderId}', async (event) => {
    const newData = event.data?.after.data();
    const previousData = event.data?.before.data();

    if (!newData || !previousData) {
      console.log('Dados do documento não encontrados');
      return null;
    }

    // Verificar se o status mudou
    if (newData.status === previousData.status) {
      return null;
    }

    // Verificar se temos um template para o novo status
    const template = emailTemplates[newData.status as keyof typeof emailTemplates];
    if (!template) {
      console.log('Status não tem template de email:', newData.status);
      return null;
    }

    try {
      // Enviar email para o cliente
      await sendEmail(
        newData.user.email,
        template.subject,
        template.template(newData.id, newData.user.name)
      );

      // Registrar o envio do email no histórico do pedido
      await event.data?.after.ref.update({
        statusHistory: {
          ...newData.statusHistory,
          [newData.status]: {
            ...newData.statusHistory[newData.status],
            emailSent: true,
            emailSentAt: admin.firestore.FieldValue.serverTimestamp()
          }
        }
      });

      return null;
    } catch (error) {
      console.error('Erro ao processar atualização de status:', error);
      throw error;
    }
  }); 