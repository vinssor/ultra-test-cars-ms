import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './car.entity';
import { CarsController } from './cars.controller';
import { CarsErrorTransformer } from './cars.error-transformer';
import { CarsService } from './cars.service';
import { Owner } from './owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Owner, Car])],
  providers: [CarsErrorTransformer, CarsService],
  controllers: [CarsController],
  exports: [CarsService]
})
export class CarsModule {}
