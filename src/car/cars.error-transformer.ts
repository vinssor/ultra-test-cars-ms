import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import {
  ErrorFilter,
  StopChaining,
  TypedErrorFilter
} from '../error/error.transformer';
import {
  EntityRelationError,
  OrmErrorTransformer
} from '../orm/orm.error-transformer';
import { NoManufacturerFoundError } from './no-manufacturer-found.error';

const NoManufacturerErrorFilter: ErrorFilter = new TypedErrorFilter(
  EntityRelationError,
  error =>
    error.message.indexOf('manufacturerId') > -1
      ? new NoManufacturerFoundError(error.parameters[1])
      : error,
  StopChaining
);

@Injectable()
export class CarsErrorTransformer extends OrmErrorTransformer {
  constructor(connection: Connection) {
    super(connection, [NoManufacturerErrorFilter]);
  }
}
