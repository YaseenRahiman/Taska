import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createHash } from 'crypto';

export interface PayFastPaymentData {
  merchant_id: string;
  merchant_key: string;
  return_url: string;
  cancel_url: string;
  notify_url: string;
  name_first: string;
  name_last: string;
  email_address: string;
  m_payment_id: string;
  amount: string;
  item_name: string;
  item_description: string;
  signature: string;
}

export interface PayFastNotification {
  m_payment_id: string;
  pf_payment_id: string;
  payment_status: string;
  item_name: string;
  item_description: string;
  amount_gross: string;
  amount_fee: string;
  amount_net: string;
  custom_str1?: string;
  custom_str2?: string;
  custom_str3?: string;
  custom_str4?: string;
  custom_str5?: string;
  custom_int1?: string;
  custom_int2?: string;
  custom_int3?: string;
  custom_int4?: string;
  custom_int5?: string;
  name_first: string;
  name_last: string;
  email_address: string;
  merchant_id: string;
  signature: string;
}

@Injectable()
export class PayfastService {
  private readonly logger = new Logger(PayfastService.name);
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly merchantKey: string;
  private readonly passphrase: string;

  constructor(private readonly configService: ConfigService) {
    this.merchantId = this.configService.get<string>('PAYFAST_MERCHANT_ID') || '';
    this.merchantKey = this.configService.get<string>('PAYFAST_MERCHANT_KEY') || '';
    this.passphrase = this.configService.get<string>('PAYFAST_PASSPHRASE') || '';

    const isSandbox = this.configService.get<string>('PAYFAST_SANDBOX') === 'true';
    this.baseUrl = isSandbox
      ? 'https://sandbox.payfast.co.za/eng/process'
      : 'https://www.payfast.co.za/eng/process';

    if (!this.merchantId || !this.merchantKey) {
      this.logger.warn('PayFast credentials are not configured. PayFast payment processing will not be available.');
    }
  }

  /**
   * Generate PayFast payment data for form submission
   */
  async generatePaymentData(
    amount: number,
    jobId: string,
    userEmail: string,
    userFirstName: string,
    userLastName: string,
    itemName: string,
    itemDescription: string,
  ): Promise<PayFastPaymentData> {
    try {
      const baseUrl = this.configService.get<string>('NEXT_PUBLIC_API_URL') || 'http://localhost:3000';
      
      const paymentData = {
        merchant_id: this.merchantId,
        merchant_key: this.merchantKey,
        return_url: `${baseUrl}/api/payments/payfast/return`,
        cancel_url: `${baseUrl}/api/payments/payfast/cancel`,
        notify_url: `${baseUrl}/api/payments/payfast/notify`,
        name_first: userFirstName,
        name_last: userLastName,
        email_address: userEmail,
        m_payment_id: jobId,
        amount: amount.toFixed(2),
        item_name: itemName,
        item_description: itemDescription,
      };

      // Generate signature
      const signature = this.generateSignature(paymentData);

      this.logger.debug(`Generated PayFast payment data for job: ${jobId}`);

      return {
        ...paymentData,
        signature,
      };
    } catch (error) {
      this.logger.error(`Failed to generate PayFast payment data: ${error.message}`);
      throw new BadRequestException('Failed to generate payment data');
    }
  }

  /**
   * Validate PayFast notification signature
   */
  async validateNotification(notification: PayFastNotification): Promise<boolean> {
    try {
      // Remove signature from notification data for validation
      const { signature, ...dataForValidation } = notification;
      
      // Generate expected signature
      const expectedSignature = this.generateSignature(dataForValidation);
      
      const isValid = signature === expectedSignature;
      
      if (isValid) {
        this.logger.debug(`PayFast notification validated for payment: ${notification.m_payment_id}`);
      } else {
        this.logger.warn(`Invalid PayFast notification signature for payment: ${notification.m_payment_id}`);
      }
      
      return isValid;
    } catch (error) {
      this.logger.error(`Failed to validate PayFast notification: ${error.message}`);
      return false;
    }
  }

  /**
   * Process PayFast notification and return payment status
   */
  async processNotification(notification: PayFastNotification): Promise<{
    isValid: boolean;
    paymentStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED';
    paymentId: string;
    amount: number;
  }> {
    try {
      const isValid = await this.validateNotification(notification);
      
      if (!isValid) {
        return {
          isValid: false,
          paymentStatus: 'FAILED',
          paymentId: notification.m_payment_id,
          amount: parseFloat(notification.amount_gross),
        };
      }

      let paymentStatus: 'COMPLETED' | 'FAILED' | 'CANCELLED' = 'FAILED';
      
      switch (notification.payment_status) {
        case 'COMPLETE':
          paymentStatus = 'COMPLETED';
          break;
        case 'FAILED':
          paymentStatus = 'FAILED';
          break;
        case 'CANCELLED':
          paymentStatus = 'CANCELLED';
          break;
        default:
          paymentStatus = 'FAILED';
      }

      this.logger.debug(`Processed PayFast notification: ${notification.m_payment_id}, status: ${paymentStatus}`);

      return {
        isValid: true,
        paymentStatus,
        paymentId: notification.m_payment_id,
        amount: parseFloat(notification.amount_gross),
      };
    } catch (error) {
      this.logger.error(`Failed to process PayFast notification: ${error.message}`);
      throw new BadRequestException('Failed to process payment notification');
    }
  }

  /**
   * Generate MD5 signature for PayFast
   */
  private generateSignature(data: Record<string, any>): string {
    // Create parameter string
    const paramString = Object.keys(data)
      .filter(key => data[key] !== '' && data[key] !== null && data[key] !== undefined)
      .sort()
      .map(key => `${key}=${encodeURIComponent(data[key].toString().trim())}`)
      .join('&');

    // Add passphrase if configured
    const stringToHash = this.passphrase 
      ? `${paramString}&passphrase=${encodeURIComponent(this.passphrase.trim())}`
      : paramString;

    // Generate MD5 hash
    return createHash('md5').update(stringToHash).digest('hex');
  }

  /**
   * Calculate PayFast fees (approximately 3.5% + R2.00)
   */
  async calculatePayFastFees(amount: number): Promise<{
    fee: number;
    netAmount: number;
  }> {
    // PayFast fee structure: 3.5% + R2.00 (minimum R1.00, maximum R55.00)
    const percentageFee = amount * 0.035;
    const fixedFee = 2.00;
    let totalFee = percentageFee + fixedFee;

    // Apply minimum and maximum fee limits
    totalFee = Math.max(1.00, Math.min(55.00, totalFee));
    totalFee = Math.round(totalFee * 100) / 100; // Round to 2 decimal places

    const netAmount = Math.round((amount - totalFee) * 100) / 100;

    return {
      fee: totalFee,
      netAmount: Math.max(0, netAmount),
    };
  }

  /**
   * Get PayFast payment URL for redirecting users
   */
  getPaymentUrl(): string {
    return this.baseUrl;
  }

  /**
   * Format amount for PayFast (2 decimal places)
   */
  formatAmount(amount: number): string {
    return amount.toFixed(2);
  }

  /**
   * Validate South African ID number (basic validation)
   */
  validateSouthAfricanId(idNumber: string): boolean {
    // Remove spaces and check length
    const cleanId = idNumber.replace(/\s/g, '');
    
    if (cleanId.length !== 13) {
      return false;
    }

    // Check if all characters are digits
    if (!/^\d{13}$/.test(cleanId)) {
      return false;
    }

    // Luhn algorithm check for South African ID numbers
    const digits = cleanId.split('').map(Number);
    const checkDigit = digits[12];
    
    let sum = 0;
    for (let i = 0; i < 12; i++) {
      if (i % 2 === 0) {
        sum += digits[i];
      } else {
        const doubled = digits[i] * 2;
        sum += doubled > 9 ? doubled - 9 : doubled;
      }
    }

    const calculatedCheckDigit = (10 - (sum % 10)) % 10;
    
    return checkDigit === calculatedCheckDigit;
  }
}
