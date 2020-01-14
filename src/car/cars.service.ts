import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Car } from './car.entity';

@Injectable()
export class CarsService extends TypeOrmCrudService<Car> {
  constructor(@InjectRepository(Car) repo: Repository<Car>) {
    super(repo);
  }
}
