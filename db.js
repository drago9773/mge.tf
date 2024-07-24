import { eq, and, gte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, UserRole } from './schema.js';

const sqlite = new Database('users.db');
export const db = drizzle(sqlite);

const mgeDb = new Database('sourcemod-local.sq3');
export const eloDb = drizzle(mgeDb, { readonly: true });


export async function isAdmin(param_steamID) {
    const moderators = await db.select().from(users).where(and(eq(users.steamId, param_steamID), gte(users.permissionLevel, UserRole.ADMIN)));
    return moderators.length > 0;
}
