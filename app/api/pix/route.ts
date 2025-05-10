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

    const mercadopagoPayload = {
      transaction_amount: Number(amount),
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
      external_reference: `ORDER_${Date.now()}`,
      notification_url: 'https://seu-site.com/webhook',
      statement_descriptor: 'Nossa Cozinha'
    }

    console.log('Payload Mercado Pago:', mercadopagoPayload)

    // Gerar um ID único para a requisição
    const idempotencyKey = uuidv4()

    const response = await fetch('https://api.mercadopago.com/v1/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer TEST-5338159686365370-050721-a76b211a4d715cd281995e4002b62d84-187235033',
        'X-Idempotency-Key': idempotencyKey
      },
      body: JSON.stringify(mercadopagoPayload),
    })

    const data = await response.json()
    console.log('Resposta Mercado Pago:', data)
    
    if (!response.ok) {
      console.error('Erro Mercado Pago:', data)
      return NextResponse.json(
        { 
          error: data.message || 'Erro ao gerar pagamento',
          details: data
        },
        { status: 400 }
      )
    }

    return NextResponse.json({
      id: data.id,
      qr_code: data.point_of_interaction.transaction_data.qr_code,
      qr_code_base64: data.point_of_interaction.transaction_data.qr_code_base64,
      status: data.status,
    })
  } catch (error) {
    console.error('Erro ao processar pagamento PIX:', error)
    return NextResponse.json(
      { 
        error: 'Erro ao processar pagamento',
        details: error instanceof Error ? error.message : 'Erro desconhecido'
      },
      { status: 500 }
    )
  }
}