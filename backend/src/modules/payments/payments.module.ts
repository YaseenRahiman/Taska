import { Module, forwardRef } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PaymentsService } from './payments.service';
import { PaymentsController } from './payments.controller';
import { WalletsController } from './wallets.controller';
import { WalletsService } from './wallets.service';
import { StripeService } from './services/stripe.service';
import { PayfastService } from './services/payfast.service';
import { EscrowService } from './services/escrow.service';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { MonetizationModule } from '../monetization/monetization.module';

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    ConfigModule,
    forwardRef(() => MonetizationModule),
  ],
  controllers: [
    PaymentsController,
    WalletsController,
  ],
  providers: [
    PaymentsService,
    WalletsService,
    StripeService,
    PayfastService,
    EscrowService,
  ],
  exports: [
    PaymentsService,
    WalletsService,
    StripeService,
    PayfastService,
    EscrowService,
  ],
})
export class PaymentsModule {}
