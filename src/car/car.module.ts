import { Module } from '@nestjs/common';
import { ManufacturerModule } from '../manufacturer/manufacturer.module';
import { CarController } from './car.controller';
import { CarRepositoryToken } from './car.repository';
import { InMemoryCarRepository } from './car.repository.imemory';
import { CarService } from './car.service';

@Module({
  imports: [ManufacturerModule],
  controllers: [CarController],
  providers: [
    { provide: CarRepositoryToken, useClass: InMemoryCarRepository },
    CarService
  ]
})
export class CarModule {}
