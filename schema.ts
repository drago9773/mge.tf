import { sql } from 'drizzle-orm';
import { unique } from 'drizzle-orm/mysql-core';
import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

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
export const playerStatus = {
  MEMBER: 0,
  ADMIN: 1,
  STATUS: 2,
};
export const pendingStatus = {
  TEAM: 0,
  ADMIN: 1,
};


export const global = sqliteTable('global', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  signupClosed: integer('signup_closed').default(0),
  rosterLocked: integer('roster_locked').default(0),
  paymentRequired: integer('payment_required').default(0),
  naSignupSeasonId: integer('na_signup_season_id').references(() => seasons.id),
  euSignupSeasonId: integer('eu_signup_season_id').references(() => seasons.id),
});
export type Global = typeof global.$inferSelect;

export const announcements = sqliteTable('announcements', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  content: text('content').notNull(),
  visible: integer('visible').default(0)
});

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
  categories: text('categories'),
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
  name: text('name').notNull(),
  signupCost: real('signup_cost').default(0.00)
});

export const regions = sqliteTable('regions', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  name: text('name').notNull()
});

export const seasons = sqliteTable('seasons', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seasonNum: integer('season_num').notNull(),
  numWeeks: integer('num_weeks').notNull(),
  regionId: integer('region_id').notNull().references(() => regions.id),
});

export type Region = typeof regions.$inferSelect;
export type Season = typeof seasons.$inferSelect;

export interface JoinedSeason extends Season {
  regionName: string;
}

export interface SeasonsByRegion {
  [key: number]: {
    regionName: string;
    seasons: JoinedSeason[];
  }
}

export const playoffs = sqliteTable('playoffs', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  seasonId: integer('season_id').notNull().references(() => seasons.id),
  numRounds: integer('num_rounds'),
  isTournament: integer('is_tournament', { mode: 'boolean' }).notNull(),
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
  seasonId: integer('season_id').references(() => seasons.id),
  is1v1: integer('is_1v1').default(0),
  status: integer('status').notNull().default(TeamStatus.UNREADY),
  paymentStatus: integer('payment_status').notNull().default(0),
  joinPassword: text('join_password'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`)
});

export const teams_history = sqliteTable('teams_history', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  teamId: integer('team_id').notNull().references(() => teams.id),
  name: text('name').notNull(),
  acronym: text('acronym'),
  avatar: text('avatar'),
  wins: integer('wins').notNull().default(0),
  losses: integer('losses').notNull().default(0),
  gamesWon: integer('games_won').notNull().default(0),
  gamesLost: integer('games_lost').notNull().default(0),
  pointsScored: integer('points_scored').notNull().default(0),
  pointsScoredAgainst: integer('points_scored_against').notNull().default(0),
  divisionId: integer('division_id'),
  regionId: integer('region_id'),
  seasonId: integer('season_id').notNull(),
  is1v1: integer('is_1v1').default(0),
  status: integer('status').notNull().default(0),
  paymentStatus: integer('payment_status').notNull().default(0),
  joinPassword: text('join_password'),
  createdAt: text('created_at').default(sql`CURRENT_TIMESTAMP`),
});

export const matches = sqliteTable('matches', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  homeTeamId: integer('home_team_id').notNull().references(() => teams.id),
  awayTeamId: integer('away_team_id').notNull().references(() => teams.id),
  winnerId: integer('winner_id').references(() => teams.id),
  winnerScore: integer('winner_score'),
  loserScore: integer('loser_score'),
  seasonId: integer('season_id').notNull().references(() => seasons.id), // References the season's primary key
  seasonNo: integer('season_no').notNull(), 
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
  teamId: integer('team_id').references(() => teams.id),
  status: integer('status').default(0)
});

export const denied_players = sqliteTable('denied_players', {
  playerSteamId: text('player_steam_id').references(() => users.steamId),
  teamId: integer('team_id').references(() => teams.id),
  reason: text('reason'),
  adminId: text('admin_id').references(() => users.steamId),
  deniedAt: text('denied_at').default(sql`CURRENT_TIMESTAMP`)
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
  permissionLevel: integer('permission_level').notNull().default(0), // 0 for member, 1 for moderator, 2 for owner
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
  description: text('description'),
  bracketLink: text('bracket_link'),
  avatar: text('avatar'),
  startedAt: text('started_at'),
  winner1SteamId: text('winner1_steam_id'),
  winner2SteamId: text('winner2_steam_id'),
  isTeamTournament: integer('is_team_tournament', { mode: 'boolean' }).default(false)
});

export const fight_night = sqliteTable('fight_night', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  card: text('card'),
  description: text('description'),
  prizepool: real('prizepool').default(0)
});

export const fight_night_matchups = sqliteTable('fight_night_matchups', {
  id: integer('id').primaryKey({ autoIncrement: true }),
  fightNightId: integer('fight_night_id').references(() => fight_night.id),
  player1SteamId: text('player1_steam_id').references(() => users.steamId),
  player2SteamId: text('player2_steam_id').references(() => users.steamId),
  orderNum: integer('order_num').notNull()
});

export const payments = sqliteTable('payments', {
  paymentId: text('payment_id').notNull().primaryKey(),
  purchasedFor: text('purchased_for').notNull().references(() => users.steamId),
  purchasedBy: text('purchased_by').notNull().references(() => users.steamId),
  amount: text('amount').notNull(),
  currency: text('currency'),
  purchaseDate: text('purchase_date').notNull(),
  description: text('description'),
  teamId: integer('team_id').references(() => teams.id),
});
