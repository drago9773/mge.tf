select * from pending_players;

CREATE TABLE IF NOT EXISTS `global` (
    `signup_closed` INTEGER DEFAULT 0,
    `roster_locked` INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_count` integer NOT NULL,
	`post_count` integer NOT NULL,
	`period` integer NOT NULL,
	`owner` text,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `arenas` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `name` text NOT NULL,
    `avatar` text
);

CREATE TABLE IF NOT EXISTS `divisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
    `signup_cost` float DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`num_weeks` integer DEFAULT 0
);

CREATE TABLE IF NOT EXISTS `teams` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `name` text NOT NULL,
    `acronym` text,
    `avatar` text,
    `wins` integer DEFAULT 0,
    `losses` integer DEFAULT 0,
    `games_won` integer DEFAULT 0,
    `games_lost` integer DEFAULT 0,
    `points_scored` integer DEFAULT 0,
    `points_scored_against` integer DEFAULT 0,
    `division_id` integer,
    `region_id` integer,
    `season_no` integer,
    `is_1v1` integer DEFAULT 0,
    `status` integer DEFAULT 0,
    `payment_status` integer DEFAULT 0,
    `join_password` text,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`season_no`) REFERENCES `seasons`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `teams_history` (
    `team_id` integer NOT NULL,
    `season_no` integer NOT NULL,
    `region_id` integer NOT NULL,
    `division_id` integer NOT NULL,
    `wins` integer DEFAULT 0,
    `losses` integer DEFAULT 0,
    `created_at` datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`season_no`) REFERENCES `seasons`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    UNIQUE (`team_id`, `season_no`)
);

CREATE TABLE IF NOT EXISTS `teamname_history` (
    `team_id` integer,
    `name` text,
    `change_date` datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `matches` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `home_team_id` integer NOT NULL,
    `away_team_id` integer NOT NULL,
	`winner_id` integer,
    `winner_score` integer, -- num matches winner team won in the BO series
    `loser_score` integer, -- num matches loser team won in the BO series
    `season_no` integer NOT NULL,
    `week_no` integer NOT NULL,
	`bo_series` integer,
	`match_date_time` datetime,
    `status` integer NOT NULL,
    `submitted_by` integer,
    `submitted_at` integer,
    FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
	FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`season_no`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`submitted_by`) REFERENCES `users`(`steam_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `games` (
    `match_id` integer NOT NULL,
    `game_num` integer NOT NULL,
    `home_team_score` integer,
    `away_team_score` integer,
    `arena_id` integer,  -- Reference to arenas table
    FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`arena_id`) REFERENCES `arenas`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `moderators` (
	`steam_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
-- UPDATE users SET permission_level = 3 WHERE steam_id = 76561198082657536;
-- INSERT INTO `moderators` (`steam_id`)
-- VALUES ('76561198082657536');
-- UPDATE users SET permission_level = 3 WHERE steam_id = 76561199668472297;
-- INSERT INTO `moderators` (`steam_id`)
-- VALUES ('76561199668472297');

CREATE TABLE IF NOT EXISTS `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`steam_id` text,
	`steam_username` text,
	`steam_avatar` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS `pending_players` (
    `player_steam_id` text,
    `team_id` integer,
    `status` integer DEFAULT 0,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `denied_players` (
    `player_steam_id` text,
    `team_id` integer,
    `reason` text,
    `admin_id` text,
    `denied_at` datetime DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`steam_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
    FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `players_in_teams` (
    `player_steam_id` text,
    `team_id` integer,
    `active` integer DEFAULT 1, --0 for inactive, 1 for active, active by default
    `permission_level` integer DEFAULT 0, --0 for member, 1 for moderator, 2 for owner
    `started_at` datetime DEFAULT CURRENT_TIMESTAMP, 
    `left_at` datetime DEFAULT NULL,
    FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE NO ACTION ON DELETE NO ACTION,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE NO ACTION ON DELETE NO ACTION
);

CREATE TABLE IF NOT EXISTS `match_comms` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `content` text,
    `reschedule` datetime,
    `reschedule_status` integer, --0 for proposed, 1 for accepted, 2 for denied, 3 for canceled
    `created_at` integer DEFAULT CURRENT_TIMESTAMP,
    `match_id` integer NOT NULL,
    `owner` text,
    FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`thread` integer NOT NULL,
	`owner` text,
	FOREIGN KEY (`thread`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`bumped_at` integer DEFAULT CURRENT_TIMESTAMP,
	`owner` text,
    `hidden` integer DEFAULT 0,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `users` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`steam_username` text NOT NULL,
	`steam_avatar` text,
	`permission_level` integer default 0,
	`ban_status` integer default 0,
	`name_override` integer default 0
);

CREATE TABLE IF NOT EXISTS `discord` (
    `discord_id` text PRIMARY KEY NOT NULL,
    `discord_username` text NOT NULL,
    `discord_avatar` text,
	`player_steam_id` text NOT NULL,
    FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `punishment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_steam_id` text NOT NULL,
    `punished_by` text NOT NULL,
    `duration` integer,
    `start_date_time` integer,
    `status` integer, --0 for passed, 1 for current
    `severity` integer, --0 for warning, 1 for suspension 2 for permanent
    `reason` text,
    FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`punished_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `demos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `file` text NOT NULL,
	`player_steam_id` text NOT NULL,
	`submitted_by` text NOT NULL,
	`submitted_at` integer DEFAULT CURRENT_TIMESTAMP,
	`match_id` integer,
    `title` text,
    `description` text,
    FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`submitted_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `demo_report` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `demo_id` integer NOT NULL,
	`reported_by` text NOT NULL,
	`reported_at` integer DEFAULT CURRENT_TIMESTAMP,
    `status` integer NOT NULL,
	`description` text,
    `admin_id` text,
    `admin_comments` text,
    FOREIGN KEY (`demo_id`) REFERENCES `demos`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`admin_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP,
	`description` text,
	`avatar` text,
	`bracket_link` text
);
CREATE TABLE IF NOT EXISTS `payments` (
	`payment_id` text PRIMARY KEY NOT NULL,
	`purchased_for` text NOT NULL,
    `purchased_by` text NOT NULL,
    `amount` text,
    `currency` text,
    `purchase_date` integer,
    `description` text,
    FOREIGN KEY (`purchased_for`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
    FOREIGN KEY (`purchased_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
CREATE TABLE IF NOT EXISTS `announcements` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `content` text,
    `visible` integer DEFAULT 0
);
