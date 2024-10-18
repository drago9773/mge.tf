CREATE TABLE `arenas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `games` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_id` integer NOT NULL,
	`home_team_score` integer NOT NULL,
	`away_team_score` integer NOT NULL,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `matches` ADD `bo_series` integer;--> statement-breakpoint
ALTER TABLE `matches` ADD `played_at` integer;--> statement-breakpoint
ALTER TABLE `teams` ADD `team_avatar` text;--> statement-breakpoint
ALTER TABLE `teams` ADD `wins` text DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teams` ADD `losses` text DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teams` ADD `status` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teams` DROP COLUMN `record`;