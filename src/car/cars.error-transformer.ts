import { Injectable } from '@nestjs/common';
import { Connection } from 'typeorm';
import {
  ErrorResolver,
  ErrorResolverChainBreak,
  TypedErrorResolver
} from '../error/error.transformer';
import {
  EntityRelationError,
  OrmErrorTransformer
} from '../orm/orm.error-transformer';
import { NoManufacturerFoundError } from './no-manufacturer-found.error';

const NoManufacturerErrorResolver: ErrorResolver = new TypedErrorResolver(
  EntityRelationError,
  error =>
    error.message.indexOf('manufacturerId') > -1
      ? new NoManufacturerFoundError(error?.parameters[1])
      : error,
  ErrorResolverChainBreak
);

@Injectable()
export class CarsErrorTransformer extends OrmErrorTransformer {
  constructor(connection: Connection) {
    super(connection, [NoManufacturerErrorResolver]);
  }
}
