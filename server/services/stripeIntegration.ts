import Stripe from 'stripe';
import { getSupabaseAdmin } from '../db';

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  if (stripeClient) return stripeClient;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    return null;
  }

  try {
    stripeClient = new Stripe(key, {
      apiVersion: '2025-02-24.acacia' as any
    });
    return stripeClient;
  } catch (err) {
    console.error('Failed to initialize Stripe client:', err);
    return null;
  }
}

export async function createStripePaymentIntent(params: {
  amountInCents: number;
  currency?: string;
  orderNumber: string;
  customerEmail: string;
  metadata?: Record<string, string>;
}) {
  const stripe = getStripe();
  if (!stripe) {
    // Return simulated payment intent for local testing before Stripe key is injected
    return {
      clientSecret: `pi_mock_${Date.now()}_secret_${Math.random().toString(36).substring(2, 10)}`,
      paymentIntentId: `pi_${Date.now()}`,
      mode: 'mock_preview'
    };
  }

  try {
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(params.amountInCents),
      currency: params.currency || 'aud',
      receipt_email: params.customerEmail,
      metadata: {
        orderNumber: params.orderNumber,
        ...params.metadata
      },
      automatic_payment_methods: {
        enabled: true
      }
    });

    return {
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      mode: 'live_stripe'
    };
  } catch (error: any) {
    console.error('Stripe PaymentIntent error:', error);
    throw error;
  }
}

export async function handleStripeWebhookEvent(payload: any, signature: string | string[] | undefined) {
  const stripe = getStripe();
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  if (!stripe || !webhookSecret || !signature) {
    return { success: false, reason: 'Stripe webhook secret not configured' };
  }

  try {
    const sig = Array.isArray(signature) ? signature[0] : signature;
    const event = stripe.webhooks.constructEvent(payload, sig, webhookSecret);

    if (event.type === 'payment_intent.succeeded') {
      const paymentIntent = event.data.object as Stripe.PaymentIntent;
      const orderNumber = paymentIntent.metadata?.orderNumber;

      if (orderNumber) {
        const supabase = getSupabaseAdmin();
        if (supabase) {
          await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              status: 'payment_confirmed',
              updated_at: new Date().toISOString()
            })
            .eq('order_number', orderNumber);
        }
      }
    }

    return { success: true, received: true };
  } catch (err: any) {
    console.error('Stripe webhook processing error:', err);
    return { success: false, error: err.message };
  }
}
