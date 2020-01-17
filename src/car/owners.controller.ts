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
import { Owner } from './owner.entity';
import { OwnersService } from './owners.service';
import { OwnerNameAlreadyExistsError } from './owner-name-already-exists.error';

@Catch(OwnerNameAlreadyExistsError)
class OwnerNameAlreadyExistsExceptionFilter extends BaseExceptionFilter {
  catch(exception: OwnerNameAlreadyExistsError, host: ArgumentsHost) {
    super.catch(
      new ConflictException(
        `Duplicate owner with name [${exception.ownerName}]`
      ),
      host
    );
  }
}

@Crud({
  model: {
    type: Owner
  },
  params: {
    carId: {
      field: 'carId',
      type: 'string'
    },
    id: {
      field: 'id',
      type: 'string',
      primary: true
    }
  }
})
@UseFilters(OwnerNameAlreadyExistsExceptionFilter)
@Controller('cars/:carId/owners')
export class OwnersController {
  constructor(public service: OwnersService) {}
}
