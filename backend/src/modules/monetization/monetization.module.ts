import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { CreditService } from './services/credit.service';
import { LoyaltyService } from './services/loyalty.service';
import { LevelService } from './services/level.service';
import { BoostService } from './services/boost.service';
import { CreditController } from './controllers/credit.controller';
import { LoyaltyController } from './controllers/loyalty.controller';
import { LevelController } from './controllers/level.controller';
import { BoostController } from './controllers/boost.controller';

@Module({
  imports: [PrismaModule],
  controllers: [
    CreditController,
    LoyaltyController,
    LevelController,
    BoostController,
  ],
  providers: [
    CreditService,
    LoyaltyService,
    LevelService,
    BoostService,
  ],
  exports: [
    CreditService,
    LoyaltyService,
    LevelService,
    BoostService,
  ],
})
export class MonetizationModule {}
