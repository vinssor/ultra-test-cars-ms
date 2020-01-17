import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { OrmCrudService } from '../orm/orm.crud-service';
import { Owner } from './owner.entity';
import { OwnersErrorTransformer } from './owners.error-transformer';

@Injectable()
export class OwnersService extends OrmCrudService<Owner> {
  constructor(
    @InjectRepository(Owner) repo: Repository<Owner>,
    errorTransformer: OwnersErrorTransformer
  ) {
    super(repo, errorTransformer);
  }
}
