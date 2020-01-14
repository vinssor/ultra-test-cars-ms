import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Car } from './car.entity';
import { CarsController } from './cars.controller';
import { CarsExceptionFilter } from './cars.exception-filter';
import { CarsService } from './cars.service';
import { Owner } from './owner.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Owner, Car])],
  providers: [
    CarsService,
    CarsExceptionFilter
  ],
  controllers: [CarsController],
  exports: [CarsService]
})
export class CarModule { }
