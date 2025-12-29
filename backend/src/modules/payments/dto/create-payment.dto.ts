import { IsString, IsDecimal, IsEnum, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsCuid } from '../../../common/validators/is-cuid.validator';

export enum PaymentMethod {
  CREDIT_CARD = 'CREDIT_CARD',
  DEBIT_CARD = 'DEBIT_CARD',
  EFT = 'EFT',
  MOBILE_MONEY = 'MOBILE_MONEY',
  WALLET = 'WALLET',
}

export class CreatePaymentDto {
  @ApiProperty({
    description: 'Job ID for the payment',
    example: 'cmgzjb71a0003aexl2yrhmcbf',
  })
  @IsCuid()
  jobId: string;

  @ApiProperty({
    description: 'Payment amount in ZAR',
    example: 1500.00,
  })
  @IsDecimal({ decimal_digits: '2' })
  amount: number;

  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.CREDIT_CARD,
  })
  @IsEnum(PaymentMethod)
  paymentMethod: PaymentMethod;

  @ApiPropertyOptional({
    description: 'Payment provider (stripe, payfast)',
    example: 'stripe',
  })
  @IsOptional()
  @IsString()
  paymentProvider?: string;

  @ApiPropertyOptional({
    description: 'Additional payment metadata',
    example: { cardLast4: '4242' },
  })
  @IsOptional()
  metadata?: Record<string, any>;
}
