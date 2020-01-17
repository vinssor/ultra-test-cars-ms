import { BullModule } from '@nestjs/bull';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './car.entity';
import { CarsController } from './cars.controller';
import { CarsErrorTransformer } from './cars.error-transformer';
import { CarsService } from './cars.service';
import { Owner } from './owner.entity';
import { OwnersService } from './owners.service';
import { OwnersController } from './owners.controller';
import { OwnersErrorTransformer } from './owners.error-transformer';
import { JobsService } from './jobs.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Car, Owner]),
    BullModule.registerQueue({
      name: 'car',
      redis: {
        host: 'localhost',
        port: 16379
      }
    })
  ],
  providers: [
    CarsErrorTransformer,
    OwnersErrorTransformer,
    CarsService,
    OwnersService,
    JobsService
  ],
  controllers: [CarsController, OwnersController],
  exports: [CarsService, OwnersService]
})
export class CarsModule {}
