import {
  DuplicateEntityError,
  OrmErrorTransformer
} from '../orm/orm.error-transformer';
import { OwnerNameAlreadyExistsError } from './owner-name-already-exists.error';
import {
  StopChaining,
  ErrorFilter,
  TypedErrorFilter
} from '../error/error.transformer';
import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';

const OwnerNameAlreadyExistsErrorFilter: ErrorFilter = new TypedErrorFilter(
  DuplicateEntityError,
  error =>
    error.message.indexOf('uc_car_ownername') > -1
      ? new OwnerNameAlreadyExistsError(error.parameters[1])
      : error,
  StopChaining
);

@Injectable()
export class OwnersErrorTransformer extends OrmErrorTransformer {
  constructor(connection: Connection) {
    super(connection, [OwnerNameAlreadyExistsErrorFilter]);
  }
}
