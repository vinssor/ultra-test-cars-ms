import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrmCrudService } from '../orm/orm.crud-service';
import { Car } from './car.entity';
import { CarsErrorTransformer } from './cars.error-transformer';

@Injectable()
export class CarsService extends OrmCrudService<Car> {
  constructor(
    @InjectRepository(Car) repo: Repository<Car>,
    errorTransformer: CarsErrorTransformer
  ) {
    super(repo, errorTransformer);
  }
}
