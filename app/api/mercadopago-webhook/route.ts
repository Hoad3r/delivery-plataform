import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { doc, updateDoc, getDoc } from "firebase/firestore"

// Development configuration - Replace with environment variables in production
const MERCADO_PAGO_ACCESS_TOKEN = "TEST-5338159686365370-050721-a76b211a4d715cd281995e4002b62d84-187235033"

// Evolution API configuration - Uncomment when ready to implement
/*
const EVOLUTION_API_URL = "http://localhost:8080"
const EVOLUTION_API_KEY = "your_evolution_api_key_here"

async function notifyEvolutionAPI(orderId: string, paymentData: any) {
  try {
    const response = await fetch(`${EVOLUTION_API_URL}/api/v1/messages/send`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "apikey": EVOLUTION_API_KEY,
      },
      body: JSON.stringify({
        number: paymentData.payer.phone?.number || "",
        options: {
          delay: 1200,
        },
        textMessage: {
          text: `✅ Pagamento aprovado!\n\nPedido: ${orderId}\nValor: R$ ${paymentData.transaction_amount}\n\nObrigado pela sua compra!`
        }
      })
    })

    if (!response.ok) {
      console.error("Failed to send Evolution API notification:", await response.text())
    }
  } catch (error) {
    console.error("Error sending Evolution API notification:", error)
  }
}
*/

export async function POST(request: Request) {
  try {
    const data = await request.json()
    console.log("Received webhook data:", data)

    // Verify if it's a payment notification
    if (data.type !== "payment") {
      return NextResponse.json({ message: "Not a payment notification" }, { status: 200 })
    }

    // Get payment details from Mercado Pago
    const paymentId = data.data.id
    const response = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: {
        "Authorization": `Bearer ${MERCADO_PAGO_ACCESS_TOKEN}`,
        "Content-Type": "application/json"
      }
    })

    if (!response.ok) {
      throw new Error(`Failed to fetch payment details: ${response.statusText}`)
    }

    const paymentData = await response.json()
    console.log("Payment data:", paymentData)

    // Check if payment is approved
    if (paymentData.status === "approved") {
      // Get order ID from external_reference
      const orderId = paymentData.external_reference
      if (!orderId) {
        throw new Error("No order ID found in payment data")
      }

      // Update order status in Firestore
      const orderRef = doc(db, "orders", orderId)
      const orderDoc = await getDoc(orderRef)

      if (!orderDoc.exists()) {
        throw new Error(`Order ${orderId} not found`)
      }

      await updateDoc(orderRef, {
        status: "confirmed",
        payment: {
          ...orderDoc.data().payment,
          status: "approved",
          approvedAt: new Date().toISOString(),
          paymentId: paymentId,
          paymentMethod: paymentData.payment_method_id,
          transactionId: paymentData.transaction_details.transaction_id
        }
      })

      // Evolution API notification - Uncomment when ready to implement
      /*
      await notifyEvolutionAPI(orderId, paymentData)
      */

      return NextResponse.json({ 
        message: "Payment processed successfully",
        orderId,
        status: "approved"
      })
    }

    return NextResponse.json({ 
      message: "Payment not approved",
      status: paymentData.status
    })

  } catch (error) {
    console.error("Error processing webhook:", error)
    return NextResponse.json(
      { error: "Internal server error", details: error },
      { status: 500 }
    )
  }
} 