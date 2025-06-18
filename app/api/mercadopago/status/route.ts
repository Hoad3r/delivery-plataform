import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    console.log('🔍 Status API called with paymentId:', paymentId);

    if (!paymentId) {
      console.error('❌ Payment ID is required');
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('❌ Mercado Pago access token not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    console.log('📡 Fetching payment details from Mercado Pago...');
    const mercadopagoResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!mercadopagoResponse.ok) {
      const errorData = await mercadopagoResponse.json();
      console.error('❌ Error fetching Mercado Pago payment status:', errorData);
      return NextResponse.json({ error: 'Failed to fetch payment status', details: errorData }, { status: mercadopagoResponse.status });
    }

    const paymentData = await mercadopagoResponse.json();
    console.log('📊 Mercado Pago payment data:', {
      id: paymentData.id,
      status: paymentData.status,
      external_reference: paymentData.external_reference,
      payment_method_id: paymentData.payment_method_id,
      transaction_details: paymentData.transaction_details
    });

    return NextResponse.json(paymentData);

  } catch (error) {
    console.error('❌ Error in status API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 