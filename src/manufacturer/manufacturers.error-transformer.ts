import {
  DuplicateEntityError,
  OrmErrorTransformer
} from '../orm/orm.error-transformer';
import {
  StopChaining,
  ErrorFilter,
  TypedErrorFilter
} from '../error/error.transformer';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import { ManufacturerNameAlreadyExistsError } from './manufacturer-name-already-exists.error';

const ManufacturerNameAlreadyExistsErrorFilter: ErrorFilter = new TypedErrorFilter(
  DuplicateEntityError,
  error =>
    error.message.indexOf('uc_manufacturer_name') > -1
      ? new ManufacturerNameAlreadyExistsError(error.parameters[1])
      : error,
  StopChaining
);

@Injectable()
export class ManufacturersErrorTransformer extends OrmErrorTransformer {
  constructor(connection: Connection) {
    super(connection, [ManufacturerNameAlreadyExistsErrorFilter]);
  }
}
