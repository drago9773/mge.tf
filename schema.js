import { sql } from 'drizzle-orm';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const UserRole = {
  GUEST: 0,
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
};

export const users = sqliteTable('users', {
  steamId: text('steam_id').primaryKey(),
  steamUsername: text('steam_username').notNull(),
  steamAvatar: text('steam_avatar'),
  isSignedUp: integer('isSignedUp').default(0),
  permissionLevel: integer('permission_level').notNull().default(UserRole.GUEST),
  isBanned: integer('is_banned').notNull().default(0),
});

export const threads = sqliteTable('threads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
  bumpedAt: integer('bumped_at').default(sql`CURRENT_TIMESTAMP`),
  owner: text('owner').references(() => users.steamId),
  hidden: integer('hidden').default(0),
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
  thread: integer('thread').notNull().references(() => threads.id),
  owner: text('owner').references(() => users.steamId),
  hidden: integer('hidden').default(0)
});

export const activity = sqliteTable('activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadCount: integer('thread_count').notNull(),
  postCount: integer('post_count').notNull(),
  period: integer('period').notNull(),
  owner: text('owner').references(() => users.steamId),
});

export const moderators = sqliteTable('moderators', {
  steamId: text('steam_id').primaryKey().references(() => users.steamId),
});

export const divisions = sqliteTable('divisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  record: text('record'),
  divisionId: integer('division_id').references(() => divisions.id),
  regionId: integer('region_id').references(() => regions.id),
  seasonNo: integer('season_no'),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  homeTeamId: integer('home_team_id').notNull().references(() => teams.id),
  awayTeamId: integer('away_team_id').notNull().references(() => teams.id),
  divisionId: integer('division_id').notNull().references(() => divisions.id),
  loserScore: integer('loser_score'),
  seasonNo: integer('season_no').notNull(),
  weekNo: integer('week_no').notNull(),
  winnerId: integer('winner_id').references(() => teams.id),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  steamId: text('steam_id'),
  steamUsername: text('steam_username'),
  steamAvatar: text('steam_avatar'),
  createdAt: integer('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const playersInTeams = sqliteTable('players_in_teams', {
  playerId: integer('player_id').references(() => players.id),
  teamId: integer('team_id').references(() => teams.id),
  startedAt: integer('started_at').default(sql`CURRENT_TIMESTAMP`),
  leftAt: integer('left_at'),
});