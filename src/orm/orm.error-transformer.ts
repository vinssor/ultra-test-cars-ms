import { Connection, DatabaseType, QueryFailedError } from 'typeorm';
import {
  ErrorResolver,
  ErrorResolverChainContinue,
  ErrorResolverChainStrategy,
  ErrorTransformer,
  TypedErrorResolver
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

export class QueryFailedErrorResolver<T> extends TypedErrorResolver<
  QueryFailedError,
  T
> {
  constructor(
    resolveError: (error: QueryFailedError) => T,
    chainStrategy: ErrorResolverChainStrategy<T>
  ) {
    super(QueryFailedError, resolveError, chainStrategy);
  }
}

export class SqlDuplicateEntityErrorResolver extends QueryFailedErrorResolver<
  DuplicateEntityError
> {
  constructor(chainStrategy: ErrorResolverChainStrategy<DuplicateEntityError>) {
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
const defaultSqlDuplicateEntityErrorResolver = new SqlDuplicateEntityErrorResolver(
  ErrorResolverChainContinue
);

export class SqlEntityRelationErrorResolver extends QueryFailedErrorResolver<
  EntityRelationError
> {
  constructor(chainStrategy: ErrorResolverChainStrategy<EntityRelationError>) {
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

const defaultSqlEntityRelationErrorResolver = new SqlEntityRelationErrorResolver(
  ErrorResolverChainContinue
);

export class OrmErrorTransformer extends ErrorTransformer {
  constructor(
    readonly connection: Connection,
    resolvers?: ErrorResolver[] | Iterable<ErrorResolver>
  ) {
    super(
      OrmErrorTransformer.concat(
        OrmErrorTransformer.ormErrorResolvers(connection.options.type),
        resolvers
      )
    );
  }

  static concat(
    ormResolvers: ErrorResolver[],
    resolvers?: ErrorResolver[] | Iterable<ErrorResolver>
  ): ErrorResolver[] {
    if (!resolvers) {
      return ormResolvers;
    }
    return ormResolvers.concat(
      Array.isArray(resolvers) ? resolvers : Array.from(resolvers)
    );
  }

  static ormErrorResolvers(databaseType: DatabaseType): ErrorResolver[] {
    const ormResolvers: ErrorResolver[] = [];
    switch (databaseType) {
      case 'mongodb': // TODO
      default:
        ormResolvers.push(defaultSqlDuplicateEntityErrorResolver);
        ormResolvers.push(defaultSqlEntityRelationErrorResolver);
    }
    return ormResolvers;
  }
}
