import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Connection, Repository } from 'typeorm';
import { OrmCrudService } from '../orm/orm.crud-service';
import { OrmErrorTransformer } from '../orm/orm.error-transformer';
import { Manufacturer } from './manufacturer.entity';

@Injectable()
export class ManufacturersService extends OrmCrudService<Manufacturer> {
  constructor(
    @InjectRepository(Manufacturer) repo: Repository<Manufacturer>,
    connection: Connection
  ) {
    super(repo, new OrmErrorTransformer(connection));
  }
}
