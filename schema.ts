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
  nameOverride: integer('name_override').notNull().default(0)
});

export const threads = sqliteTable('threads', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  title: text('title').notNull(),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  bumpedAt: text('bumped_at').default(sql`CURRENT_TIMESTAMP`),
  owner: text('owner').references(() => users.steamId),
  hidden: integer('hidden').default(0)
});

export const posts = sqliteTable('posts', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  thread: integer('thread').notNull().references(() => threads.id),
  owner: text('owner').references(() => users.steamId),
  hidden: integer('hidden').default(0)
});

export const activity = sqliteTable('activity', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  threadCount: integer('thread_count').notNull(),
  postCount: integer('post_count').notNull(),
  period: integer('period').notNull(),
  owner: text('owner').references(() => users.steamId)
});

export const moderators = sqliteTable('moderators', {
  steamId: text('steam_id').primaryKey().references(() => users.steamId)
});

export const arenas = sqliteTable('arenas', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  avatar: text('avatar')
});

export const divisions = sqliteTable('divisions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
});

export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
});

export const seasons = sqliteTable('seasons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  numWeeks: integer('num_weeks').default(0)
});

export const teams = sqliteTable('teams', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  acronym: text('acronym'),
  avatar: text('avatar'),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  pointsScored: integer('points_scored').notNull().default(0),
  pointsScoredAgainst: integer('points_scored_against').notNull().default(0),
  divisionId: integer('division_id').references(() => divisions.id),
  regionId: integer('region_id').references(() => regions.id),
  seasonNo: integer('season_no').references(() => seasons.id),
  is1v1: integer('is_1v1').default(0),
  status: integer('status').default(0),
  joinPassword: text('join_password'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  homeTeamId: integer('home_team_id').notNull().references(() => teams.id),
  awayTeamId: integer('away_team_id').notNull().references(() => teams.id),
  winnerId: integer('winner_id').references(() => teams.id),
  winnerScore: integer('winner_score'),
  loserScore: integer('loser_score'),
  seasonNo: integer('season_no').notNull().references(() => seasons.id),
  weekNo: integer('week_no').notNull(),
  boSeries: integer('bo_series'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
  playedAt: integer('played_at')
});

export const games = sqliteTable('games', {
  matchId: integer('match_id').notNull().references(() => matches.id),
  gameNum: integer('game_num').notNull(),
  homeTeamScore: integer('home_team_score'),
  awayTeamScore: integer('away_team_score'),
  arenaId: integer('arena_id').references(() => arenas.id)
});

export const players = sqliteTable('players', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  steamId: text('steam_id'),
  steamUsername: text('steam_username'),
  steamAvatar: text('steam_avatar'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const pending_players = sqliteTable('pending_players', {
  playerSteamId: text('player_steam_id').references(() => users.steamId),
  teamId: integer('team_id').references(() => teams.id)
});

export const teamname_history = sqliteTable('teamname_history', {
  teamId: integer('team_id').references(() => teams.id),
  name: text('name'),
  changeDate: text('change_date').default(sql`CURRENT_TIMESTAMP`)
});


export const players_in_teams = sqliteTable('players_in_teams', {
  playerSteamId: text('player_steam_id').references(() => users.steamId),
  teamId: integer('team_id').references(() => teams.id),
  active: integer('active').default(1),
  permissionLevel: integer('permission_level').notNull().default(0),
  startedAt: text('started_at').default(sql`CURRENT_TIMESTAMP`),
  leftAt: text('left_at').default(sql`0`)
});