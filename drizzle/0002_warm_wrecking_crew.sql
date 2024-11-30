CREATE TABLE `demo_report` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`demo_id` integer NOT NULL,
	`reported_by` text,
	`reported_at` text DEFAULT CURRENT_TIMESTAMP,
	`status` integer DEFAULT 1,
	`description` text,
	`admin_id` text,
	`admin_comments` text,
	FOREIGN KEY (`demo_id`) REFERENCES `demos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `demos` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`file` text NOT NULL,
	`player_steam_id` text,
	`submitted_by` text,
	`submitted_at` text DEFAULT CURRENT_TIMESTAMP,
	`match_id` integer,
	`title` text,
	`description` text,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action
);
