import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Stripe from 'stripe';

export interface StripePaymentIntent {
  id: string;
  amount: number;
  currency: string;
  status: string;
  clientSecret: string;
}

export interface StripeCustomer {
  id: string;
  email: string;
}

@Injectable()
export class StripeService {
  private readonly logger = new Logger(StripeService.name);
  private readonly stripe: Stripe;

  constructor(private readonly configService: ConfigService) {
    const secretKey = this.configService.get<string>('STRIPE_SECRET_KEY');
    if (!secretKey) {
      throw new Error('STRIPE_SECRET_KEY is not configured');
    }

    this.stripe = new Stripe(secretKey, {
      apiVersion: '2022-11-15',
    });
  }

  async createCustomer(email: string, name?: string): Promise<StripeCustomer> {
    try {
      const customer = await this.stripe.customers.create({
        email,
        name,
      });

      this.logger.debug(`Created Stripe customer: ${customer.id}`);

      return {
        id: customer.id,
        email: customer.email,
      };
    } catch (error) {
      this.logger.error(`Failed to create Stripe customer: ${error.message}`);
      throw new BadRequestException('Failed to create payment customer');
    }
  }

  async createPaymentIntent(
    amount: number,
    currency: string = 'zar',
    customerId?: string,
    metadata?: Record<string, string>,
  ): Promise<StripePaymentIntent> {
    try {
      // Convert amount to cents (Stripe expects smallest currency unit)
      const amountInCents = Math.round(amount * 100);

      const paymentIntent = await this.stripe.paymentIntents.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        customer: customerId,
        metadata,
        automatic_payment_methods: {
          enabled: true,
        },
      });

      this.logger.debug(`Created payment intent: ${paymentIntent.id}`);

      return {
        id: paymentIntent.id,
        amount: paymentIntent.amount / 100, // Convert back to major currency unit
        currency: paymentIntent.currency,
        status: paymentIntent.status,
        clientSecret: paymentIntent.client_secret,
      };
    } catch (error) {
      this.logger.error(`Failed to create payment intent: ${error.message}`);
      throw new BadRequestException('Failed to create payment intent');
    }
  }

  async confirmPaymentIntent(paymentIntentId: string): Promise<boolean> {
    try {
      const paymentIntent = await this.stripe.paymentIntents.retrieve(paymentIntentId);
      
      if (paymentIntent.status === 'succeeded') {
        this.logger.debug(`Payment intent confirmed: ${paymentIntentId}`);
        return true;
      }

      this.logger.warn(`Payment intent not succeeded: ${paymentIntentId}, status: ${paymentIntent.status}`);
      return false;
    } catch (error) {
      this.logger.error(`Failed to confirm payment intent: ${error.message}`);
      throw new BadRequestException('Failed to confirm payment');
    }
  }

  async retrievePaymentIntent(paymentIntentId: string): Promise<Stripe.PaymentIntent> {
    try {
      return await this.stripe.paymentIntents.retrieve(paymentIntentId);
    } catch (error) {
      this.logger.error(`Failed to retrieve payment intent: ${error.message}`);
      throw new BadRequestException('Failed to retrieve payment information');
    }
  }

  async refundPayment(
    paymentIntentId: string,
    amount?: number,
    reason?: string,
  ): Promise<Stripe.Refund> {
    try {
      const refundData: Stripe.RefundCreateParams = {
        payment_intent: paymentIntentId,
        reason: reason as Stripe.RefundCreateParams.Reason,
      };

      if (amount) {
        refundData.amount = Math.round(amount * 100); // Convert to cents
      }

      const refund = await this.stripe.refunds.create(refundData);

      this.logger.debug(`Created refund: ${refund.id} for payment: ${paymentIntentId}`);

      return refund;
    } catch (error) {
      this.logger.error(`Failed to create refund: ${error.message}`);
      throw new BadRequestException('Failed to process refund');
    }
  }

  async createTransfer(
    destinationAccount: string,
    amount: number,
    currency: string = 'zar',
    metadata?: Record<string, string>,
  ): Promise<Stripe.Transfer> {
    try {
      const amountInCents = Math.round(amount * 100);

      const transfer = await this.stripe.transfers.create({
        amount: amountInCents,
        currency: currency.toLowerCase(),
        destination: destinationAccount,
        metadata,
      });

      this.logger.debug(`Created transfer: ${transfer.id}`);

      return transfer;
    } catch (error) {
      this.logger.error(`Failed to create transfer: ${error.message}`);
      throw new BadRequestException('Failed to create transfer');
    }
  }

  async constructWebhookEvent(
    payload: string | Buffer,
    signature: string,
  ): Promise<Stripe.Event> {
    const webhookSecret = this.configService.get<string>('STRIPE_WEBHOOK_SECRET');
    
    if (!webhookSecret) {
      throw new Error('STRIPE_WEBHOOK_SECRET is not configured');
    }

    try {
      return this.stripe.webhooks.constructEvent(payload, signature, webhookSecret);
    } catch (error) {
      this.logger.error(`Failed to construct webhook event: ${error.message}`);
      throw new BadRequestException('Invalid webhook signature');
    }
  }

  async calculatePlatformFee(amount: number, feePercentage: number = 10): Promise<number> {
    return Math.round((amount * feePercentage / 100) * 100) / 100;
  }

  async calculateVAT(amount: number, vatRate: number = 15): Promise<number> {
    return Math.round((amount * vatRate / 100) * 100) / 100;
  }
}
