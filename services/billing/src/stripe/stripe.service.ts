import Stripe from 'stripe';

export class StripeService {
  private readonly stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
    apiVersion: '2024-06-20',
  });

  createSchoolSubscription(customerId: string, priceId: string) {
    return this.stripe.subscriptions.create({
      customer: customerId,
      items: [{ price: priceId }],
    });
  }

  constructWebhookEvent(payload: string | Buffer, signature: string) {
    const secret = process.env.STRIPE_WEBHOOK_SECRET || '';
    return this.stripe.webhooks.constructEvent(payload, signature, secret);
  }
}

