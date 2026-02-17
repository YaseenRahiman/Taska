import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CommonModule } from '../../common/common.module';
import { CreditService } from './services/credit.service';
import { LoyaltyService } from './services/loyalty.service';
import { LevelService } from './services/level.service';
import { BoostService } from './services/boost.service';
import { SubscriptionService } from './services/subscription.service';
import { CreditController } from './controllers/credit.controller';
import { LoyaltyController } from './controllers/loyalty.controller';
import { LevelController } from './controllers/level.controller';
import { BoostController } from './controllers/boost.controller';
import { SubscriptionController } from './controllers/subscription.controller';

@Module({
  imports: [PrismaModule, CommonModule],
  controllers: [
    CreditController,
    LoyaltyController,
    LevelController,
    BoostController,
    SubscriptionController,
  ],
  providers: [
    CreditService,
    LoyaltyService,
    LevelService,
    BoostService,
    SubscriptionService,
  ],
  exports: [
    CreditService,
    LoyaltyService,
    LevelService,
    BoostService,
    SubscriptionService,
  ],
})
export class MonetizationModule {}
