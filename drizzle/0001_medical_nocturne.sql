CREATE TABLE `tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP,
	`description` text,
	`avatar` text,
	`bracket_link` text
);
