CREATE TABLE `pending_players` (
	`player_steam_id` text,
	`team_id` integer,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `players_in_teams` (
	`player_steam_id` text,
	`team_id` integer,
	`active` integer DEFAULT 1,
	`permission_level` integer DEFAULT 0,
	`started_at` integer DEFAULT CURRENT_TIMESTAMP,
	`left_at` integer DEFAULT 'null',
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `teamname_history` (
	`team_id` integer,
	`name` text,
	`change_date` integer DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `matches` ADD `winner_id` integer REFERENCES teams(id);--> statement-breakpoint
ALTER TABLE `teams` ADD `is_1v1` integer DEFAULT 0;--> statement-breakpoint
ALTER TABLE `teams` ADD `join_password` text;--> statement-breakpoint
/*
 SQLite does not support "Creating foreign key on existing column" out of the box, we do not generate automatic migration for that, so it has to be done manually
 Please refer to: https://www.techonthenet.com/sqlite/tables/alter_table.php
                  https://www.sqlite.org/lang_altertable.html

 Due to that we don't generate migration automatically and it has to be done manually
*/