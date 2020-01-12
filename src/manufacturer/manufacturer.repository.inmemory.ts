import { Injectable } from '@nestjs/common';
import { RecordDTO } from '../common/common.dto';
import {
  InMemoryRepository,
  StringIdGenerator
} from '../common/common.repository.inmemory';
import { ManufacturerDTO } from './manufacturer.dto';
import { ManufacturerRepository } from './manufacturer.repository';

@Injectable()
export class InMemoryManufacturerRepository
  extends InMemoryRepository<string, ManufacturerDTO>
  implements ManufacturerRepository {
  constructor(values?: RecordDTO<string, ManufacturerDTO>[]) {
    super(new StringIdGenerator(), values);
  }
}
