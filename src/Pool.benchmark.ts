import * as tape from "tape";
import { Suite, Event } from "benchmark";
import { Pool } from "./Pool";

const ITERATIONS = 1_000_000;

class Person {
  name: string;
  meta: {
    age?: number;
  } = {};

  constructor(name: string, age: number) {
    this.name = name;
    this.meta.age = age;
  }
  static init(person: Person, name: string, age: number) {
    person.name = name;
    person.meta.age = age;
  }
  static deconstructor(person: Person) {
    person.name = null as never as string;
    delete person.meta.age;
  }
}

tape("Create and release", (assert: tape.Test) => {
  new Suite()
    .add("Native", async () => {
      await run(() => {
        const array: Person[] = [];
        for (let i = 0, il = ITERATIONS; i < il; i++) {
          array.push(new Person("billy", 21));
        }
        array.length = 0;
      });
    })
    .add(
      "Create and release",
      (() => {
        const pool = new Pool(Person, Person.init, Person.deconstructor);

        return async () => {
          await run(() => {
            const array: Person[] = [];
            for (let i = 0, il = ITERATIONS; i < il; i++) {
              array.push(pool.create("billy", 21));
            }
            pool.releaseAll(array);
            array.length = 0;
          });
        };
      })(),
    )
    .add(
      "Create after hitting limit",
      (() => {
        const pool = new Pool(
          Person,
          Person.init,
          Person.deconstructor,
          ITERATIONS * 0.5,
        );
        return async () => {
          await run(() => {
            const array: Person[] = [];
            for (let i = 0, il = ITERATIONS; i < il; i++) {
              array.push(pool.create("billy", 21));
            }
            pool.releaseAll(array);
            array.length = 0;
          });
        };
      })(),
    )
    .on("cycle", function (this: Suite, event: Event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      assert.end();
    })
    .run({ async: true });
});

const FRAMES = 10;
async function run(fn: () => void, frames = FRAMES): Promise<void> {
  return new Promise((resolve) => {
    let count = 0;
    function update() {
      fn();
      if (++count <= frames) {
        process.nextTick(update);
      } else {
        resolve();
      }
    }
    update();
  });
}
