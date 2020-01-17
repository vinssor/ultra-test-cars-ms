import { Connection, DatabaseType, QueryFailedError } from 'typeorm';
import {
  ContinueChaining,
  ErrorFilter,
  ErrorFilterChainingStrategy,
  ErrorTransformer,
  TypedErrorFilter
} from '../error/error.transformer';

/**
 * The ORM duplicate entity error
 */
export class DuplicateEntityError extends Error {
  readonly parameters: any[];
  constructor(message: string, parameters?: any[]) {
    super(message);
    this.parameters = parameters ? parameters : [];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * The ORM entity relation error
 */
export class EntityRelationError extends Error {
  readonly parameters: any[];
  constructor(message: string, parameters?: any[]) {
    super(message);
    this.parameters = parameters ? parameters : [];
    Object.setPrototypeOf(this, new.target.prototype);
  }
}

/**
 * A query failed error filter using catchError map function and chaining strategy
 */
export class QueryFailedErrorFilter<T> extends TypedErrorFilter<
  QueryFailedError,
  T
> {
  constructor(
    catchError: (error: QueryFailedError) => T,
    chainingStrategy: ErrorFilterChainingStrategy<T>
  ) {
    super(QueryFailedError, catchError, chainingStrategy);
  }
}

/**
 * The SQL duplicate entity error filter using chaining strategy
 */
export class SqlDuplicateEntityErrorFilter extends QueryFailedErrorFilter<
  DuplicateEntityError
> {
  constructor(
    chainingStrategy: ErrorFilterChainingStrategy<DuplicateEntityError>
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
    }, chainingStrategy);
  }
}
const defaultSqlDuplicateEntityErrorFilter = new SqlDuplicateEntityErrorFilter(
  ContinueChaining
);

/**
 * The SQL entity relation error filter using chaining strategy
 */
export class SqlEntityRelationErrorFilter extends QueryFailedErrorFilter<
  EntityRelationError
> {
  constructor(
    chainingStrategy: ErrorFilterChainingStrategy<EntityRelationError>
  ) {
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
    }, chainingStrategy);
  }
}

const defaultSqlEntityRelationErrorFilter = new SqlEntityRelationErrorFilter(
  ContinueChaining
);

/**
 * The ORM Error transformer provides duplicate entity and entity relation errors mappings
 */
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
