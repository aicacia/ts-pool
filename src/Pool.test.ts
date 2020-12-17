import * as tape from "tape";
import { Pool } from "./Pool";

class Person {
  name: string;
  meta: {
    age?: number;
  } = {};

  constructor(name: string, age: number) {
    this.name = name;
    this.meta.age = age;
  }
  static deconstructor(person: Person) {
    person.name = null as any;
    person.meta = {};
  }
}

tape("Pool", (assert: tape.Test) => {
  const pool = new Pool(Person, Person.deconstructor),
    person = pool.create("billy", 21);

  assert.equal(person.name, "billy");
  assert.equal(person.meta.age, 21);

  pool.release(person);

  assert.equal(person.name, null);
  assert.equal(person.meta.age, undefined);

  const newPerson = pool.create("bob", 61);

  assert.equal(newPerson.name, "bob");
  assert.equal(newPerson.meta.age, 61);

  assert.equal(newPerson, person);

  assert.end();
});

tape("Pool limits", (assert: tape.Test) => {
  const pool = new Pool(Person, Person.deconstructor).setLimit(500),
    created = [];

  for (let i = 0, il = 1000; i < il; i++) {
    created.push(pool.create("billy", 21));
  }

  for (const person of created) {
    pool.release(person);
  }

  assert.equal(pool.getSize(), 500);

  assert.end();
});
