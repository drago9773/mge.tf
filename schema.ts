import { sql } from 'drizzle-orm';
import { datetime } from 'drizzle-orm/mysql-core';
import { sqliteTable, text, integer } from 'drizzle-orm/sqlite-core';

export const UserRole = {
  GUEST: 0,
  USER: 1,
  MODERATOR: 2,
  ADMIN: 3,
};
export const BanStatus = {
  NONE: 0,
  WARNING: 1,
  SUSPENDED: 2,
  BANNED: 3,
}
export const Severity = {
  WARNING: 0,
  SUSPENDED: 1,
  BANNED: 2,
}
export const MatchStatus = {
  UNPLAYED: 0,
  PLAYED: 1,
  DISPUTE: 2,
};
export const TeamStatus = {
  DEAD: -1,
  UNREADY: 0,
  PENDING: 1,
  READY: 2,
};
export const DemoStatus = {
  CLEAR: 0,
  REVIEW: 1,
  ACTION: 2,
};

export const users = sqliteTable('users', {
  steamId: text('steam_id').primaryKey(),
  steamUsername: text('steam_username').notNull(),
  steamAvatar: text('steam_avatar'),
  permissionLevel: integer('permission_level').notNull().default(UserRole.GUEST),
  banStatus: integer('ban_status').notNull().notNull().default(BanStatus.NONE),
  nameOverride: integer('name_override').notNull().default(0)
});

export const discord = sqliteTable('discord', {
  discordId: text('discord_id').primaryKey(),
  discordUsername: text('discord_username'),
  discordAvatar: text('discord_avatar'),
  playerSteamId: text('player_steam_id').references(() => users.steamId),
})

export const punishment = sqliteTable('punishment', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  playerSteamId: text('player_steam_id').references(() => users.steamId),
  punishedBy: text('punished_by').references(() => users.steamId),
  duration: integer('duration'),
  startDateTime: integer('start_date_time'),
  status: integer('status'),
  severity: integer('severity'),
  reason: text('reason')
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
  gamesWon: integer('games_won').notNull().default(0),
  gamesLost: integer('games_lost').notNull().default(0),
  pointsScored: integer('points_scored').notNull().default(0),
  pointsScoredAgainst: integer('points_scored_against').notNull().default(0),
  divisionId: integer('division_id').references(() => divisions.id),
  regionId: integer('region_id').references(() => regions.id),
  seasonNo: integer('season_no').references(() => seasons.id),
  is1v1: integer('is_1v1').default(0),
  status: integer('status').notNull().default(TeamStatus.UNREADY),
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
  matchDateTime: text('match_date_time'),
  status: integer('status').notNull().default(MatchStatus.UNPLAYED),
  submittedBy: text('submitted_by').references(() => users.steamId),
  submittedAt: integer('submitted_at'),
});

export const match_comms = sqliteTable('match_comms', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content'),
  reschedule: text('reschedule'),
  rescheduleStatus: integer('reschedule_status'),
  createdAt: integer('created_At'),
  matchId: integer('match_id').notNull().references(() => matches.id),
  owner: text('owner').references(() => users.steamId),
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

export const demos = sqliteTable('demos', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  file: text('file').notNull(),
  playerSteamId: text('player_steam_id').references(() => users.steamId),
  submittedBy: text('submitted_by').references(() => users.steamId),
  submittedAt: text('submitted_at').default(sql`CURRENT_TIMESTAMP`),
  matchId: integer('match_id').references(() => matches.id),
  title: text('title'),
  description: text('description')
});

export const demo_report = sqliteTable('demo_report', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  demoId: integer('demo_id').notNull().references(() => demos.id),
  reportedBy: text('reported_by').references(() => users.steamId),
  reportedAt: text('reported_at').default(sql`CURRENT_TIMESTAMP`),
  status: integer('status').notNull().default(DemoStatus.REVIEW),
  description: text('description'),
  adminId: text('admin_id').references(() => users.steamId),
  adminComments: text('admin_comments')
});

export const tournaments = sqliteTable('tournaments', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull(),
  startedAt: text('started_at').default(sql`CURRENT_TIMESTAMP`),
  description: text('description'),
  avatar: text('avatar'),
  bracketLink: text('bracket_link')
});