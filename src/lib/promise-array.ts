import * as _ from 'lodash';

export class PromiseArray<T> implements PromiseLike<T[]> {
  constructor(private array: T[] | Promise<T[]>) {}

  filter(fn: (value: T) => Promise<boolean>): PromiseArray<T> {
    return new PromiseArray(
      Promise.resolve(this.array).then(items =>
        Promise.all(items.map(fn)).then(bools =>
          items.filter((_, i) => bools[i])
        )
      )
    );
  }

  map<R>(fn: (value: T) => Promise<R>): PromiseArray<R> {
    return new PromiseArray(
      Promise.resolve(this.array).then(items => Promise.all(items.map(fn)))
    );
  }

  flatMap<R>(fn: (value: T) => Promise<R> | Promise<R[]>): PromiseArray<R> {
    return new PromiseArray(
      Promise.resolve(this.array)
        .then(items => Promise.all<R | R[]>(items.map(fn)))
        .then(items => _.flatten(items))
    );
  }

  then<TResult1 = T[], TResult2 = never>(
    onfulfilled?: (value: T[]) => TResult1 | PromiseLike<TResult1>,
    onrejected?: (reason: any) => TResult2 | PromiseLike<TResult2>
  ): PromiseLike<TResult1 | TResult2> {
    return Promise.resolve(this.array).then(onfulfilled, onrejected);
  }
}
