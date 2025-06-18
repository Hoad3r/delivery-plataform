// pages/api/pix.ts
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { amount, description, orderId } = body

    // Validação dos dados
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('Valor inválido:', amount)
      return NextResponse.json(
        { error: 'Valor inválido', received: amount },
        { status: 400 }
      )
    }

    if (!orderId) {
      console.error('ID do pedido não fornecido')
      return NextResponse.json(
        { error: 'ID do pedido é obrigatório' },
        { status: 400 }
      )
    }

    // Verificar se o token está configurado
    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN
    if (!accessToken) {
      console.error('Token de acesso do Mercado Pago não configurado')
      return NextResponse.json(
        { error: 'Configuração do Mercado Pago incompleta' },
        { status: 500 }
      )
    }

    // Formatar o valor para ter sempre 2 casas decimais
    const formattedAmount = Number(amount.toFixed(2))

    // Gerar um ID único para a requisição (idempotência)
    const idempotencyKey = uuidv4()

    const mercadopagoPayload = {
      transaction_amount: formattedAmount,
      description: description || 'Pedido Nossa Cozinha',
      payment_method_id: 'pix',
      payer: {
        email: 'cliente@nossacozinha.com',
        first_name: 'Cliente',
        last_name: 'Nossa Cozinha'
      },
      // Definir data de expiração para 24 horas
      date_of_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      external_reference: orderId,
      statement_descriptor: 'Nossa Cozinha'
    }

    try {
      // Criar o pagamento
      const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Idempotency-Key': idempotencyKey,
          'Accept': 'application/json'
        },
        body: JSON.stringify(mercadopagoPayload),
      })
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        console.error('Erro Mercado Pago:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          data: errorData
        })

        // Handle specific PIX configuration error
        if (errorData.message?.includes('Collector user without key enabled for QR')) {
          return NextResponse.json(
            { 
              error: 'Erro na configuração do PIX',
              details: 'Por favor, verifique se as credenciais da API estão corretas.',
              status: paymentResponse.status
            },
            { status: 400 }
          )
        }

        return NextResponse.json(
          { 
            error: errorData.message || 'Erro ao gerar pagamento',
            details: errorData,
            status: paymentResponse.status
          },
          { status: paymentResponse.status }
        )
      }

      const paymentData = await paymentResponse.json()

      // Extrair dados do PIX da resposta
      const pixData = paymentData.point_of_interaction?.transaction_data
      
      if (!pixData || !pixData.qr_code || !pixData.qr_code_base64) {
        console.error('Dados do PIX não encontrados na resposta:', paymentData)
        return NextResponse.json(
          { 
            error: 'Dados do PIX não encontrados',
            details: paymentData
          },
          { status: 500 }
        )
      }

      // Retornar dados do PIX
      const response = {
        id: paymentData.id,
        status: paymentData.status,
        qr_code: pixData.qr_code,
        qr_code_base64: pixData.qr_code_base64,
        ticket_url: pixData.ticket_url,
        date_of_expiration: paymentData.date_of_expiration
      }

      return NextResponse.json(response)
    } catch (fetchError) {
      console.error('Erro detalhado na requisição ao Mercado Pago:', {
        error: fetchError,
        message: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido',
        stack: fetchError instanceof Error ? fetchError.stack : undefined
      })
      return NextResponse.json(
        { 
          error: 'Erro na comunicação com o Mercado Pago',
          details: fetchError instanceof Error ? fetchError.message : 'Erro desconhecido'
        },
        { status: 500 }
      )
    }
  } catch (error) {
    console.error('Erro detalhado ao processar pagamento PIX:', {
      error: error,
      message: error instanceof Error ? error.message : 'Erro desconhecido',
      stack: error instanceof Error ? error.stack : undefined
    })
    return NextResponse.json(
      { 
        error: 'Erro ao processar pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}