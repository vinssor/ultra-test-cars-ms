import { Injectable } from '@nestjs/common';
import {
  InMemoryRepository,
  StringIdGenerator
} from '../common/common.repository.inmemory';
import { CarDTO } from './car.dto';
import { CarRepository } from './car.repository';

@Injectable()
export class InMemoryCarRepository extends InMemoryRepository<string, CarDTO>
  implements CarRepository {
  constructor() {
    super(new StringIdGenerator());
  }
}
