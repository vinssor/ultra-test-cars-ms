import { Type } from '@nestjs/common';

export interface ErrorResolverChain {
  resolve(error: any): any;
}

export interface ErrorResolver {
  resolve(error: any, chain: ErrorResolverChain): any;
}

export interface ErrorResolverChainStrategy<E> extends Function {
  (error: E): boolean;
}

export const ErrorResolverChainContinue: ErrorResolverChainStrategy<any> = (
  error: any
): boolean => true;
export const ErrorResolverChainBreak: ErrorResolverChainStrategy<any> = (
  error: any
): boolean => false;
export const ErrorResolverChainer = <E>(
  strategy: ErrorResolverChainStrategy<E>,
  error: E,
  chain: ErrorResolverChain
): any => (strategy(error) ? chain.resolve(error) : error);

export class TypedErrorResolver<F, T> implements ErrorResolver {
  constructor(
    readonly resolvedErrorType: Type<F>,
    private readonly resolveError: (error: F) => T,
    private readonly chainStrategy: ErrorResolverChainStrategy<T>
  ) {}

  resolve(error: any, chain: ErrorResolverChain): any {
    let resolvedError: T;
    if (
      error instanceof this.resolvedErrorType &&
      (resolvedError = this.resolveError(error)) &&
      <any>resolvedError !== error
    ) {
      return ErrorResolverChainer(this.chainStrategy, resolvedError, chain);
    }
    return chain.resolve(error);
  }
}

class IterableErrorResolverChain implements ErrorResolverChain {
  private readonly iterator: Iterator<ErrorResolver>;

  constructor(resolvers: ErrorResolver[] | Iterable<ErrorResolver>) {
    this.iterator = resolvers[Symbol.iterator]();
  }

  resolve(error: any): any {
    const element: IteratorResult<
      ErrorResolver,
      ErrorResolver
    > = this.iterator.next();
    if (element.done) {
      return error;
    }
    return element.value.resolve(error, this);
  }
}

export class ErrorTransformer {
  private readonly resolvers: ErrorResolver[];

  constructor(resolvers: ErrorResolver[] | Iterable<ErrorResolver>) {
    this.resolvers = Array.isArray(resolvers)
      ? resolvers.slice()
      : Array.from(resolvers);
  }

  map(error: any): any {
    return new IterableErrorResolverChain(this.resolvers).resolve(error);
  }
}
