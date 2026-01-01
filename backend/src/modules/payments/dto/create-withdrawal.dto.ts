import { IsDecimal, IsEnum, IsString, IsOptional } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export enum WithdrawalMethod {
  BANK_TRANSFER = 'BANK_TRANSFER',
  MOBILE_MONEY = 'MOBILE_MONEY',
  CRYPTO = 'CRYPTO',
}

export class CreateWithdrawalDto {
  @ApiProperty({
    description: 'Withdrawal amount in ZAR',
    example: 500.00,
  })
  @IsDecimal({ decimal_digits: '2' })
  amount: number;

  @ApiProperty({
    description: 'Withdrawal method',
    enum: WithdrawalMethod,
    example: WithdrawalMethod.BANK_TRANSFER,
  })
  @IsEnum(WithdrawalMethod)
  withdrawalMethod: WithdrawalMethod;

  @ApiProperty({
    description: 'Encrypted bank account details or mobile money number',
    example: 'encrypted_bank_account_details',
  })
  @IsString()
  bankAccount: string;

  @ApiPropertyOptional({
    description: 'Additional withdrawal notes',
    example: 'Urgent withdrawal request',
  })
  @IsOptional()
  @IsString()
  notes?: string;
}
