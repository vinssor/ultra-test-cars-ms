import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { TypeOrmCrudService } from '@nestjsx/crud-typeorm';
import { Repository } from 'typeorm';
import { Manufacturer } from './manufacturer.entity';

@Injectable()
export class ManufacturersService extends TypeOrmCrudService<Manufacturer> {
  constructor(@InjectRepository(Manufacturer) repo: Repository<Manufacturer>) {
    super(repo);
  }
}
