import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class WalletBalanceResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'user_abc123',
  })
  userId: string;

  @ApiProperty({
    description: 'Available balance in ZAR',
    example: 1250.00,
  })
  balance: number;

  @ApiProperty({
    description: 'Pending balance (withdrawals in progress)',
    example: 250.00,
  })
  pendingBalance: number;

  @ApiProperty({
    description: 'Total earnings all-time',
    example: 5000.00,
  })
  totalEarnings: number;

  @ApiProperty({
    description: 'Total withdrawals all-time',
    example: 3500.00,
  })
  totalWithdrawals: number;

  @ApiProperty({
    description: 'Currency code',
    example: 'ZAR',
  })
  currency: string;

  @ApiProperty({
    description: 'Whether wallet is active',
    example: true,
  })
  isActive: boolean;
}

export class WalletTransactionResponseDto {
  @ApiProperty({
    description: 'Transaction ID',
    example: 'txn_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Transaction type',
    enum: ['CREDIT', 'DEBIT', 'WITHDRAWAL', 'REFUND', 'FEE'],
    example: 'CREDIT',
  })
  type: 'CREDIT' | 'DEBIT' | 'WITHDRAWAL' | 'REFUND' | 'FEE';

  @ApiProperty({
    description: 'Transaction amount',
    example: 500.00,
  })
  amount: number;

  @ApiProperty({
    description: 'Balance before transaction',
    example: 1000.00,
  })
  balanceBefore: number;

  @ApiProperty({
    description: 'Balance after transaction',
    example: 1500.00,
  })
  balanceAfter: number;

  @ApiPropertyOptional({
    description: 'Transaction reference',
    example: 'payment_xyz789',
  })
  reference?: string;

  @ApiProperty({
    description: 'Transaction description',
    example: 'Payment for job completion',
  })
  description: string;

  @ApiProperty({
    description: 'Transaction timestamp',
    example: '2025-12-06T10:30:00Z',
  })
  createdAt: Date;
}

export class PaginatedTransactionsDto {
  @ApiProperty({
    description: 'List of transactions',
    type: [WalletTransactionResponseDto],
  })
  transactions: WalletTransactionResponseDto[];

  @ApiProperty({
    description: 'Total number of transactions',
    example: 45,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 3,
  })
  totalPages: number;
}

export class WithdrawalResponseDto {
  @ApiProperty({
    description: 'Withdrawal ID',
    example: 'withdraw_abc123',
  })
  id: string;

  @ApiProperty({
    description: 'Wallet ID',
    example: 'wallet_xyz789',
  })
  walletId: string;

  @ApiProperty({
    description: 'Withdrawal amount',
    example: 500.00,
  })
  amount: number;

  @ApiProperty({
    description: 'Bank account details (encrypted)',
    example: 'encrypted_account',
  })
  bankAccount: string;

  @ApiProperty({
    description: 'Withdrawal method',
    enum: ['BANK_TRANSFER', 'MOBILE_MONEY', 'CRYPTO'],
    example: 'BANK_TRANSFER',
  })
  withdrawalMethod: 'BANK_TRANSFER' | 'MOBILE_MONEY' | 'CRYPTO';

  @ApiProperty({
    description: 'Withdrawal status',
    enum: ['PENDING', 'PROCESSING', 'COMPLETED', 'REJECTED', 'CANCELLED'],
    example: 'PENDING',
  })
  status: 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'REJECTED' | 'CANCELLED';

  @ApiPropertyOptional({
    description: 'Processing timestamp',
    example: '2025-12-06T12:00:00Z',
  })
  processedAt?: Date;

  @ApiPropertyOptional({
    description: 'Rejection reason',
    example: 'Insufficient verification',
  })
  rejectedReason?: string;

  @ApiProperty({
    description: 'Request timestamp',
    example: '2025-12-06T10:30:00Z',
  })
  createdAt: Date;
}

export class PaginatedWithdrawalsDto {
  @ApiProperty({
    description: 'List of withdrawal requests',
    type: [WithdrawalResponseDto],
  })
  withdrawals: WithdrawalResponseDto[];

  @ApiProperty({
    description: 'Total number of withdrawals',
    example: 12,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 1,
  })
  totalPages: number;
}

export class WalletStatisticsDto {
  @ApiProperty({
    description: 'Total earnings all-time',
    example: 5000.00,
  })
  totalEarnings: number;

  @ApiProperty({
    description: 'Earnings this month',
    example: 750.00,
  })
  thisMonthEarnings: number;

  @ApiProperty({
    description: 'Total withdrawals all-time',
    example: 3500.00,
  })
  totalWithdrawals: number;

  @ApiProperty({
    description: 'Pending withdrawals amount',
    example: 250.00,
  })
  pendingWithdrawals: number;

  @ApiProperty({
    description: 'Number of completed jobs',
    example: 23,
  })
  completedJobsCount: number;

  @ApiProperty({
    description: 'Average job value',
    example: 217.39,
  })
  averageJobValue: number;
}
