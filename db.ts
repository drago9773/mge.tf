import { eq, and } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import Database from 'better-sqlite3';
import { users, UserRole } from './schema.ts';

const sqlite = new Database('users.db');
export const db = drizzle(sqlite);

const mgeDb = new Database('sourcemod-local.sq3');
export const eloDb = drizzle(mgeDb);

export function isAdmin(param_steamID: string | undefined) {
    if (!param_steamID) return false;
    return !!db.select().from(users).where(and(eq(users.steamId, param_steamID), eq(users.permissionLevel, UserRole.ADMIN))).get();
}

export function permissionLevelFromSteamId(param_steamID: string | undefined) {
    if (!param_steamID) return 0;
    let result = db
        .select({ permissionLevel: users.permissionLevel })
        .from(users)
        .where(eq(users.steamId, param_steamID))
        .get();
    return result ? result.permissionLevel : 0;
}

export function usernameFromSteamId(param_steamID: string) {
    return db.select({ username: users.steamUsername }).from(users).where(eq(users.steamId, param_steamID)).get()?.username ?? '';
}