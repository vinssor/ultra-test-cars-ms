import {
  ArgumentsHost,
  Catch,
  ConflictException,
  Controller,
  UseFilters
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Crud } from '@nestjsx/crud';
import { DuplicateEntityError } from '../orm/orm.error-transformer';
import { Manufacturer } from './manufacturer.entity';
import { ManufacturersService } from './manufacturers.service';

@Catch(DuplicateEntityError)
class DuplicateEntityExceptionFilter extends BaseExceptionFilter {
  catch(exception: DuplicateEntityError, host: ArgumentsHost) {
    super.catch(
      new ConflictException(
        `Duplicate manufacturer with name [${exception?.parameters[1]}]`
      ),
      host
    );
  }
}

@Crud({
  model: {
    type: Manufacturer
  },
  params: {
    id: {
      field: 'id',
      type: 'string',
      primary: true
    }
  }
})
@UseFilters(DuplicateEntityExceptionFilter)
@Controller('manufacturers')
export class ManufacturersController {
  constructor(public service: ManufacturersService) {}
}
