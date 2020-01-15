import { Connection, DatabaseType, QueryFailedError } from 'typeorm';
import {
  ErrorFilter,
  ErrorTransformer,
  TypedErrorFilter,
  ErrorFilterChainingStrategy,
  ContinueChaining
} from '../error/error.transformer';

export class DuplicateEntityError extends Error {
  constructor(message?: string, readonly parameters?: any[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class EntityRelationError extends Error {
  constructor(message?: string, readonly parameters?: any[]) {
    super(message);
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

export class QueryFailedErrorFilter<T> extends TypedErrorFilter<
  QueryFailedError,
  T
> {
  constructor(
    catchError: (error: QueryFailedError) => T,
    chainStrategy: ErrorFilterChainingStrategy<T>
  ) {
    super(QueryFailedError, catchError, chainStrategy);
  }
}

export class SqlDuplicateEntityErrorFilter extends QueryFailedErrorFilter<
  DuplicateEntityError
> {
  constructor(
    chainStrategy: ErrorFilterChainingStrategy<DuplicateEntityError>
  ) {
    super((error: QueryFailedError): DuplicateEntityError => {
      const sqlError: any = <any>error;
      const sqlState: string = sqlError.sqlState;
      if (
        (sqlState === '23000' || sqlState === '23001') &&
        error.message.toLowerCase().indexOf('duplicate') > -1
      ) {
        return new DuplicateEntityError(error.message, (<any>error).parameters);
      }
      return null;
    }, chainStrategy);
  }
}
const defaultSqlDuplicateEntityErrorFilter = new SqlDuplicateEntityErrorFilter(
  ContinueChaining
);

export class SqlEntityRelationErrorFilter extends QueryFailedErrorFilter<
  EntityRelationError
> {
  constructor(chainStrategy: ErrorFilterChainingStrategy<EntityRelationError>) {
    super((error: QueryFailedError): EntityRelationError => {
      const sqlError: any = <any>error;
      const sqlState: string = sqlError.sqlState;
      if (
        (sqlState === '23000' || sqlState === '23001') &&
        error.message.toLowerCase().indexOf('foreign key') > -1
      ) {
        return new EntityRelationError(error.message, sqlError.parameters);
      }
      return null;
    }, chainStrategy);
  }
}

const defaultSqlEntityRelationErrorFilter = new SqlEntityRelationErrorFilter(
  ContinueChaining
);

export class OrmErrorTransformer extends ErrorTransformer {
  constructor(
    readonly connection: Connection,
    filters?: ErrorFilter[] | Iterable<ErrorFilter>
  ) {
    super(
      OrmErrorTransformer.concat(
        OrmErrorTransformer.ormErrorFilters(connection.options.type),
        filters
      )
    );
  }

  static concat(
    ormFilters: ErrorFilter[],
    filters?: ErrorFilter[] | Iterable<ErrorFilter>
  ): ErrorFilter[] {
    if (!filters) {
      return ormFilters;
    }
    return ormFilters.concat(
      Array.isArray(filters) ? filters : Array.from(filters)
    );
  }

  static ormErrorFilters(databaseType: DatabaseType): ErrorFilter[] {
    const ormFilters: ErrorFilter[] = [];
    switch (databaseType) {
      case 'mongodb': // TODO
      default:
        ormFilters.push(defaultSqlDuplicateEntityErrorFilter);
        ormFilters.push(defaultSqlEntityRelationErrorFilter);
    }
    return ormFilters;
  }
}
