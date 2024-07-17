import { eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import * as schema from './schema.js';

const sqlite = new Database('users.db');
export const db = drizzle(sqlite, { schema });

const mgeDb = new Database('sourcemod-local.sq3');
export const eloDb = drizzle(mgeDb, { readonly: true });


export async function isAdmin(steamID) {
    const moderators = await db.select().from(schema.moderators).where(eq(schema.moderators.steamId, steamID));
    return moderators.length > 0;
}
