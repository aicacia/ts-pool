import * as tape from "tape";
import { Suite, Event } from "benchmark";
import { Pool } from "./Pool";

const ITERATIONS = 100000;

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
    person.name = null as any;
    person.meta = {};
  }
}

tape("Create and release", (assert: tape.Test) => {
  const pool = new Pool(Person, Person.init, Person.deconstructor),
    people: Person[] = [];

  function releasePeople() {
    for (const person of people) {
      pool.release(person);
    }
    people.length = 0;
  }

  new Suite()
    .add("Native", () => {
      const array = [];
      for (let i = 0, il = ITERATIONS; i < il; i++) {
        array.push(new Person("billy", 21));
      }
      array.length = 0;
      for (let i = 0, il = ITERATIONS; i < il; i++) {
        new Person("billy", 21);
      }
      array.length = 0;
    })
    .add("Create and release", () => {
      for (let i = 0, il = ITERATIONS; i < il; i++) {
        people.push(pool.create("billy", 21));
      }
      releasePeople();
      for (let i = 0, il = ITERATIONS; i < il; i++) {
        people.push(pool.create("billy", 21));
      }
      releasePeople();
    })
    .on("cycle", function (this: Suite, event: Event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      assert.end();
    })
    .run({ async: true });
});

tape("Create after hitting limit", (assert: tape.Test) => {
  const pool = new Pool(
    Person,
    Person.init,
    Person.deconstructor,
    ITERATIONS * 0.5
  );

  new Suite()
    .add("Native", () => {
      const array = [];
      for (let i = 0, il = ITERATIONS; i < il; i++) {
        array.push(new Person("billy", 21));
      }
      array.length = 0;
    })
    .add("Create after hitting limit", () => {
      for (let i = 0, il = ITERATIONS; i < il; i++) {
        pool.create("billy", 21);
      }
    })
    .on("cycle", function (this: Suite, event: Event) {
      console.log(String(event.target));
    })
    .on("complete", function () {
      assert.end();
    })
    .run({ async: true });
});
