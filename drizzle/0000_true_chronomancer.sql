CREATE TABLE IF NOT EXISTS `activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_count` integer NOT NULL,
	`post_count` integer NOT NULL,
	`period` integer NOT NULL,
	`owner` text,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
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
SELECT * FROM divisions;
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `matches` (
    `id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
    `home_team_id` integer NOT NULL,
    `away_team_id` integer NOT NULL,
    `division_id` integer NOT NULL,
    `loser_score` integer,
    `season_no` integer NOT NULL,
    `week_no` integer NOT NULL,
    `winner_id` integer,
    `created_at` integer DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE CASCADE,
    FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE CASCADE
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `moderators` (
	`steam_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS`players` (
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
CREATE TABLE IF NOT EXISTS `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`record` text,
	`division_id` integer,
	`region_id` integer,
	`season_no` integer,
    `status` INTEGER DEFAULT 0,
	`created_at` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE CASCADE,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE CASCADE
);
SELECT * FROM teams;

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
