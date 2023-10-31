export type IConstructor<T, A extends unknown[] = unknown[]> = new (
  ...args: A
) => T;

export type IPoolConstructor<T, A extends unknown[] = unknown[]> = (
  object: T,
  ...args: A
) => void;

export type IPoolDeconstructor<T, A extends unknown[] = unknown[]> = (
  object: T,
  ...args: A
) => void;

export function DEFAULT_DECONSTRUCTOR<T extends object>(object: T) {
  for (const key in object) {
    if (Object.hasOwn(object, key)) {
      object[key] = null as never;
    }
  }
}

export class Pool<
  T,
  CA extends unknown[] = unknown[],
  DA extends unknown[] = unknown[],
> {
  private pool: T[] = [];
  private Class: IConstructor<T, CA>;
  private Constructor: IPoolConstructor<T, CA>;
  private Deconstructor: IPoolDeconstructor<T, DA>;
  private limit: number;

  constructor(
    Class: IConstructor<T, CA>,
    Constructor: IPoolConstructor<T, CA>,
    Deconstructor: IPoolDeconstructor<T, DA> = DEFAULT_DECONSTRUCTOR as never,
    limit = Infinity,
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

  releaseAll(objects: T[], ...args: DA) {
    for (const object of objects) {
      this.Deconstructor(object, ...args);
      this.pool.push(object);
    }
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
