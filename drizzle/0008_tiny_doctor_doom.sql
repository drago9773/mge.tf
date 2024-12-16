CREATE TABLE `discord` (
	`discord_id` text PRIMARY KEY NOT NULL,
	`discord_username` text,
	`discord_avatar` text,
	`player_steam_id` text,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
ALTER TABLE `users` DROP COLUMN `discord_id`;