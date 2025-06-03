import { NextResponse } from 'next/server';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('id');

    if (!paymentId) {
      return NextResponse.json({ error: 'Payment ID is required' }, { status: 400 });
    }

    const accessToken = process.env.MERCADO_PAGO_ACCESS_TOKEN;
    if (!accessToken) {
      console.error('Mercado Pago access token not configured');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const mercadopagoResponse = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      },
    });

    if (!mercadopagoResponse.ok) {
      const errorData = await mercadopagoResponse.json();
      console.error('Error fetching Mercado Pago payment status:', errorData);
      return NextResponse.json({ error: 'Failed to fetch payment status', details: errorData }, { status: mercadopagoResponse.status });
    }

    const paymentData = await mercadopagoResponse.json();
    return NextResponse.json(paymentData);

  } catch (error) {
    console.error('Error in status API route:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
} 