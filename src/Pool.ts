import { IConstructor } from "@aicacia/core";

export type IPoolConstructor<T, A extends any[] = any[]> = (
  object: T,
  ...args: A
) => void;

export type IPoolDeconstructor<T, A extends any[] = any[]> = (
  object: T,
  ...args: A
) => void;

export function DEFAULT_DECONSTRUCTOR<T>(object: T) {
  for (const key in object) {
    if ((object as any).hasOwnProperty(key)) {
      object[key] = null as any;
    }
  }
}

export class Pool<T, CA extends any[] = any[], DA extends any[] = any[]> {
  private pool: T[] = [];
  private Class: IConstructor<T, CA>;
  private Constructor: IPoolConstructor<T, CA>;
  private Deconstructor: IPoolDeconstructor<T, DA>;
  private limit: number;

  constructor(
    Class: IConstructor<T, CA>,
    Constructor: IPoolConstructor<T, CA>,
    Deconstructor: IPoolDeconstructor<T, DA> = DEFAULT_DECONSTRUCTOR as any,
    limit = Infinity
  ) {
    this.Class = Class;
    this.Constructor = Constructor;
    this.Deconstructor = Deconstructor;
    this.limit = limit;
  }

  getLimit() {
    return this.limit;
  }
  setLimit(limit = Infinity) {
    this.limit = limit;
    return this.cleanUpPool();
  }

  create(...args: CA) {
    const object = this.pool.pop();

    if (object) {
      this.Constructor(object, ...args);
      return object;
    } else {
      return new this.Class(...args);
    }
  }

  release(object: T, ...args: DA) {
    this.Deconstructor(object, ...args);
    this.pool.push(object);
    return this.cleanUpPool();
  }

  clear() {
    this.pool.length = 0;
    return this;
  }

  getSize() {
    return this.pool.length;
  }

  private cleanUpPool() {
    if (this.limit < this.pool.length) {
      this.pool.length = this.limit;
    }
    return this;
  }
}
