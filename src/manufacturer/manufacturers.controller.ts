import {
  ArgumentsHost,
  Catch,
  ConflictException,
  Controller,
  UseFilters
} from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Crud } from '@nestjsx/crud';
import { ManufacturerNameAlreadyExistsError } from './manufacturer-name-already-exists.error';
import { Manufacturer } from './manufacturer.entity';
import { ManufacturersService } from './manufacturers.service';

@Catch(ManufacturerNameAlreadyExistsError)
class ManufacturerNameAlreadyExistsExceptionFilter extends BaseExceptionFilter {
  catch(exception: ManufacturerNameAlreadyExistsError, host: ArgumentsHost) {
    super.catch(
      new ConflictException(
        `Duplicate manufacturer with name [${exception.manufacturerName}]`
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
@UseFilters(ManufacturerNameAlreadyExistsExceptionFilter)
@Controller('manufacturers')
export class ManufacturersController {
  constructor(public service: ManufacturersService) {}
}
