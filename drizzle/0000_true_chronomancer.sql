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
    `name` text NOT NULL
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `divisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);

CREATE TABLE IF NOT EXISTS `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT,
	`num_weeks` integer DEFAULT 0
);

SELECT * from seasons;
-- INSERT INTO seasons DEFAULT VALUES;

SELECT * FROM divisions;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`team_avatar` text,
	`wins` integer DEFAULT 0,
	`losses` integer DEFAULT 0,
	`division_id` integer,
	`region_id` integer,
	`season_no` integer,
    `status` integer DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE CASCADE,
	FOREIGN KEY (`season_no`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE CASCADE,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE CASCADE
);
SELECT * FROM teams;

CREATE TABLE IF NOT EXISTS `team_season_history` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `team_id` integer NOT NULL,
    `season_no` integer NOT NULL,
    `wins` integer DEFAULT 0,
    `losses` integer DEFAULT 0,
    `created_at` integer DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`season_no`) REFERENCES `seasons`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    UNIQUE (`team_id`, `season_no`)
);
-- DROP TABLE IF EXISTS matches;
-- DROP TABLE IF EXISTS games;
-- DROP TABLE IF EXISTS teams;
SELECT * FROM games;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `matches` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `home_team_id` integer NOT NULL,
    `away_team_id` integer NOT NULL,
    `division_id` integer NOT NULL,
    `winner_score` integer, -- num matches winner team won in the BO series
    `loser_score` integer, -- num matches loser team won in the BO series
    `season_no` integer NOT NULL,
    `week_no` integer NOT NULL,
	`bo_series` integer,
    `created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`played_at` integer,
    FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`season_no`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS `games` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `match_id` integer NOT NULL,
    `home_team_score` integer NOT NULL,
    `away_team_score` integer NOT NULL,
    `arena_id` integer NOT NULL,  -- Reference to arenas table
    FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE,
    FOREIGN KEY (`arena_id`) REFERENCES `arenas`(`id`) ON UPDATE NO ACTION ON DELETE CASCADE
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `moderators` (
	`steam_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
-- INSERT INTO `moderators` (`steam_id`)
-- VALUES ('12345678901234567');

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`steam_id` text,
	`steam_username` text,
	`steam_avatar` text,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS`players_in_teams` (
	`player_id` integer,
	`team_id` integer,
	`started_at` integer DEFAULT CURRENT_TIMESTAMP,
	`left_at` integer,
	PRIMARY KEY(`player_id`, `started_at`, `team_id`),
	FOREIGN KEY (`player_id`) REFERENCES `players`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`thread` integer NOT NULL,
	`owner` text,
	FOREIGN KEY (`thread`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	`bumped_at` integer DEFAULT CURRENT_TIMESTAMP,
	`owner` text,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`steam_username` text NOT NULL,
	`steam_avatar` text
);
