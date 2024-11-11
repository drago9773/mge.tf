import { db } from './db.ts';
import { users } from './schema.ts';

let data = await db.select().from(users);
console.log(data);