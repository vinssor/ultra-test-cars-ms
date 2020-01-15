import { Type } from '@nestjs/common';

/**
 * The error filter chain
 */
export interface ErrorFilterChain {
  /**
   * Chains an error
   * @param error the error to chain
   * @returns the chain filter result
   */
  filter(error: any): any;
}

/**
 * The error filter
 */
export interface ErrorFilter {
  /**
   * Filters an error
   * @param error the error to filter
   * @param chain the filter chain to use
   * @returns any given error projection to stop filter chain or the given filter chain result
   */
  filter(error: any, chain: ErrorFilterChain): any;
}

/**
 * An error filter chaining strategy
 */
export interface ErrorFilterChainingStrategy<E> extends Function {
  /**
   * Evaluates an error to continue or stop chaining
   * @param error the error to evaluate
   * @returns true to continue chaining, or false to stop chaining
   */
  (error: E): boolean;
}

/**
 * A default ErrorFilterChainingStrategy to continue chaining
 * @param error any error
 * @returns always true
 */
export const ContinueChaining: ErrorFilterChainingStrategy<any> = (
  error: any
): boolean => true;

/**
 * A default ErrorFilterChainingStrategy to stop chaining
 * @param error any error
 * @returns always false
 */
export const StopChaining: ErrorFilterChainingStrategy<any> = (
  error: any
): boolean => false;

/**
 * Applies an error filter chaining strategy
 * @param strategy the error filter chaining strategy to apply
 * @param error the filtered error
 * @param chain the error filter chain
 */
export const ApplyErrorFilterChainingStrategy = <E>(
  strategy: ErrorFilterChainingStrategy<E>,
  error: E,
  chain: ErrorFilterChain
): any => (strategy(error) ? chain.filter(error) : error);

/**
 * A typed error filter.
 * @param <F> the filtered error type
 * @param <T> the transformed error type
 */
export class TypedErrorFilter<F, T> implements ErrorFilter {
  constructor(
    readonly filteredErrorType: Type<F>,
    private readonly catchError: (error: F) => T,
    private readonly chainingStrategy: ErrorFilterChainingStrategy<T>
  ) {}

  filter(error: any, chain: ErrorFilterChain): any {
    let resolvedError: T;
    if (
      error instanceof this.filteredErrorType &&
      (resolvedError = this.catchError(error)) &&
      <any>resolvedError !== error
    ) {
      return ApplyErrorFilterChainingStrategy(
        this.chainingStrategy,
        resolvedError,
        chain
      );
    }
    return chain.filter(error);
  }
}

class IterableErrorFilterChain implements ErrorFilterChain {
  private readonly iterator: Iterator<ErrorFilter>;

  constructor(filters: ErrorFilter[] | Iterable<ErrorFilter>) {
    this.iterator = filters[Symbol.iterator]();
  }

  filter(error: any): any {
    const element: IteratorResult<
      ErrorFilter,
      ErrorFilter
    > = this.iterator.next();
    if (element.done) {
      return error;
    }
    return element.value.filter(error, this);
  }
}

/**
 * The error transformer with a filter chain result
 */
export class ErrorTransformer {
  private readonly filters: ErrorFilter[];

  /**
   * @param filters the filters to chain
   */
  constructor(filters: ErrorFilter[] | Iterable<ErrorFilter>) {
    this.filters = Array.isArray(filters)
      ? filters.slice()
      : Array.from(filters);
  }

  /**
   * Transforms an error to anoth using filters
   * @param error the error to transform
   * @returns the transformed error
   */
  transform(error: any): any {
    return new IterableErrorFilterChain(this.filters).filter(error);
  }
}
