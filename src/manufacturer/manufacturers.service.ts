import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { OrmCrudService } from '../orm/orm.crud-service';
import { Manufacturer } from './manufacturer.entity';
import { ManufacturersErrorTransformer } from './manufacturers.error-transformer';

@Injectable()
export class ManufacturersService extends OrmCrudService<Manufacturer> {
  constructor(
    @InjectRepository(Manufacturer) repo: Repository<Manufacturer>,
    errorTransformer: ManufacturersErrorTransformer
  ) {
    super(repo, errorTransformer);
  }
}
