import { db } from './db.js';
import { users } from './schema.js';

let data = await db.select().from(users);
console.log(data);