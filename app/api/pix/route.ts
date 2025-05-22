// pages/api/pix.ts
import { NextResponse } from 'next/server'
import { v4 as uuidv4 } from 'uuid'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    console.log('Request body:', body)
    
    const { amount, description } = body

    // Validação dos dados
    if (!amount || isNaN(amount) || amount <= 0) {
      console.error('Valor inválido:', amount)
      return NextResponse.json(
        { error: 'Valor inválido', received: amount },
        { status: 400 }
      )
    }

    console.log('Gerando PIX para valor:', amount)

    // Formatar o valor para ter sempre 2 casas decimais
    const formattedAmount = Number(amount.toFixed(2))

    // Gerar um ID único para a requisição (idempotência)
    const idempotencyKey = uuidv4()

    const mercadopagoPayload = {
      transaction_amount: formattedAmount,
      description: description || 'Pedido Nossa Cozinha',
      payment_method_id: 'pix',
      payer: {
        email: 'test@test.com',
        first_name: 'Test',
        last_name: 'User',
        identification: {
          type: 'CPF',
          number: '12345678909'
        }
      },
      // Definir data de expiração para 24 horas
      date_of_expiration: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      external_reference: `ORDER_${Date.now()}`,
      notification_url: 'https://f147-168-0-235-43.ngrok-free.app/api/mercadopago-webhook',
      statement_descriptor: 'Nossa Cozinha'
    }

    console.log('Payload Mercado Pago:', mercadopagoPayload)

    try {
      console.log('Iniciando chamada ao Mercado Pago...')

      // Criar o pagamento
      const paymentResponse = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TEST-5338159686365370-050721-a76b211a4d715cd281995e4002b62d84-187235033',
          'X-Idempotency-Key': idempotencyKey,
          'Accept': 'application/json'
      },
      body: JSON.stringify(mercadopagoPayload),
    })

      console.log('Status da resposta do Mercado Pago:', paymentResponse.status)
      
      if (!paymentResponse.ok) {
        const errorData = await paymentResponse.json()
        console.error('Erro Mercado Pago:', {
          status: paymentResponse.status,
          statusText: paymentResponse.statusText,
          data: errorData
        })
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
      console.log('Resposta Mercado Pago:', paymentData)

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

      console.log('PIX gerado com sucesso:', {
        id: response.id,
        status: response.status,
        hasQrCode: !!response.qr_code,
        hasQrCodeBase64: !!response.qr_code_base64,
        expiration: response.date_of_expiration
      })

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