select * from teams;
drop table if exists threads;
drop table if exists posts;
select * from payments;

CREATE TABLE IF NOT EXISTS`activity` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`thread_count` integer NOT NULL,
	`post_count` integer NOT NULL,
	`period` integer NOT NULL,
	`owner` text,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `announcements` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`visible` integer DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `arenas` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`avatar` text
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `demo_report` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`demo_id` integer NOT NULL,
	`reported_by` text,
	`reported_at` text DEFAULT CURRENT_TIMESTAMP,
	`status` integer DEFAULT 1 NOT NULL,
	`description` text,
	`admin_id` text,
	`admin_comments` text,
	FOREIGN KEY (`demo_id`) REFERENCES `demos`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`reported_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `demos` (
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
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `denied_players` (
	`player_steam_id` text,
	`team_id` integer,
	`reason` text,
	`admin_id` text,
	`denied_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`admin_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `discord` (
	`discord_id` text PRIMARY KEY NOT NULL,
	`discord_username` text,
	`discord_avatar` text,
	`player_steam_id` text,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `divisions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`signup_cost` real DEFAULT 0
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `games` (
	`match_id` integer NOT NULL,
	`game_num` integer NOT NULL,
	`home_team_score` integer,
	`away_team_score` integer,
	`arena_id` integer,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`arena_id`) REFERENCES `arenas`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `global` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`signup_closed` integer DEFAULT 0,
	`roster_locked` integer DEFAULT 0,
	`payment_required` integer DEFAULT 0,
	`na_signup_season_id` integer,
	`eu_signup_season_id` integer,
	FOREIGN KEY (`na_signup_season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`eu_signup_season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `match_comms` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text,
	`reschedule` text,
	`reschedule_status` integer,
	`created_At` integer,
	`match_id` integer NOT NULL,
	`owner` text,
	FOREIGN KEY (`match_id`) REFERENCES `matches`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `matches` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`home_team_id` integer NOT NULL,
	`away_team_id` integer NOT NULL,
	`winner_id` integer,
	`winner_score` integer,
	`loser_score` integer,
	`season_id` integer NOT NULL,
	`season_no` integer NOT NULL,
	`week_no` integer NOT NULL,
	`bo_series` integer,
	`match_date_time` text,
	`status` integer DEFAULT 0 NOT NULL,
	`submitted_by` text,
	`submitted_at` integer,
	FOREIGN KEY (`home_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`away_team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`submitted_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `moderators` (
	`steam_id` text PRIMARY KEY NOT NULL,
	FOREIGN KEY (`steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `payments` (
	`payment_id` text PRIMARY KEY NOT NULL,
	`purchased_for` text NOT NULL,
	`purchased_by` text NOT NULL,
	`amount` text NOT NULL,
	`currency` text,
	`purchase_date` text NOT NULL,
	`description` text,
	`team_id` integer,
	FOREIGN KEY (`purchased_for`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`purchased_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `pending_players` (
	`player_steam_id` text,
	`team_id` integer,
	`status` integer DEFAULT 0,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `players` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`steam_id` text,
	`steam_username` text,
	`steam_avatar` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `players_in_teams` (
	`player_steam_id` text,
	`team_id` integer,
	`active` integer DEFAULT 1,
	`permission_level` integer DEFAULT 0 NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP,
	`left_at` text DEFAULT 0,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `playoffs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season_id` integer NOT NULL,
	`num_rounds` integer,
	`is_tournament` integer NOT NULL,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `posts` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`content` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`thread` integer NOT NULL,
	`owner` text,
	`hidden` integer DEFAULT 0,
	FOREIGN KEY (`thread`) REFERENCES `threads`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `punishment` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`player_steam_id` text,
	`punished_by` text,
	`duration` integer,
	`start_date_time` integer,
	`status` integer,
	`severity` integer,
	`reason` text,
	FOREIGN KEY (`player_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`punished_by`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `regions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `seasons` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`season_num` integer NOT NULL,
	`num_weeks` integer NOT NULL,
	`region_id` integer NOT NULL,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `teamname_history` (
	`team_id` integer,
	`name` text,
	`change_date` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `teams` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`acronym` text,
	`avatar` text,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`games_won` integer DEFAULT 0 NOT NULL,
	`games_lost` integer DEFAULT 0 NOT NULL,
	`points_scored` integer DEFAULT 0 NOT NULL,
	`points_scored_against` integer DEFAULT 0 NOT NULL,
	`division_id` integer,
	`region_id` integer,
	`season_id` integer,
	`is_1v1` integer DEFAULT 0,
	`status` integer DEFAULT 0 NOT NULL,
	`payment_status` integer DEFAULT 0 NOT NULL,
	`join_password` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`division_id`) REFERENCES `divisions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`region_id`) REFERENCES `regions`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`season_id`) REFERENCES `seasons`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `teams_history` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`team_id` integer NOT NULL,
	`name` text NOT NULL,
	`acronym` text,
	`avatar` text,
	`wins` integer DEFAULT 0 NOT NULL,
	`losses` integer DEFAULT 0 NOT NULL,
	`games_won` integer DEFAULT 0 NOT NULL,
	`games_lost` integer DEFAULT 0 NOT NULL,
	`points_scored` integer DEFAULT 0 NOT NULL,
	`points_scored_against` integer DEFAULT 0 NOT NULL,
	`division_id` integer,
	`region_id` integer,
	`season_id` integer NOT NULL,
	`is_1v1` integer DEFAULT 0,
	`status` integer DEFAULT 0 NOT NULL,
	`payment_status` integer DEFAULT 0 NOT NULL,
	`join_password` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	FOREIGN KEY (`team_id`) REFERENCES `teams`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `threads` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`categories` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP,
	`bumped_at` text DEFAULT CURRENT_TIMESTAMP,
	`owner` text,
	`hidden` integer DEFAULT 0,
	FOREIGN KEY (`owner`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
drop table if exists tournaments;
select * from tournaments;
CREATE TABLE IF NOT EXISTS `tournaments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`started_at` text DEFAULT CURRENT_TIMESTAMP,
	`description` text,
	`avatar` text,
	`bracket_link` text,
	`winner1_steam_id` text,
	`winner2_steam_id` text,
	`is_team_tournament` integer,
	FOREIGN KEY (`winner1_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`winner2_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);

CREATE TABLE IF NOT EXISTS `fight_night` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`card` text,
	`description` text,
	`prizepool` real
);

CREATE TABLE IF NOT EXISTS `fight_night_matchups` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`fight_night_id` text,
	`player1_steam_id` text,
	`player2_steam_id` text,
	`order_num` integer NOT NULL,
	FOREIGN KEY (`fight_night_id`) REFERENCES `fight_night`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player1_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`player1_steam_id`) REFERENCES `users`(`steam_id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE IF NOT EXISTS `users` (
	`steam_id` text PRIMARY KEY NOT NULL,
	`steam_username` text NOT NULL,
	`steam_avatar` text,
	`permission_level` integer DEFAULT 0 NOT NULL,
	`ban_status` integer DEFAULT 0 NOT NULL,
	`name_override` integer DEFAULT 0 NOT NULL
);

-- Drop existing triggers
DROP TRIGGER IF EXISTS mirror_insert_teams;

-- Create new insert trigger
CREATE TRIGGER IF NOT EXISTS mirror_insert_teams 
AFTER INSERT ON teams
FOR EACH ROW
BEGIN
  INSERT INTO teams_history (
    team_id, name, acronym, avatar, wins, losses, games_won, games_lost,
    points_scored, points_scored_against, division_id, region_id, season_id,
    is_1v1, status, payment_status, join_password, created_at
  )
  VALUES (
    NEW.id, NEW.name, NEW.acronym, NEW.avatar, NEW.wins, NEW.losses, NEW.games_won, NEW.games_lost,
    NEW.points_scored, NEW.points_scored_against, NEW.division_id, NEW.region_id, NEW.season_id,
    NEW.is_1v1, NEW.status, NEW.payment_status, NEW.join_password, CURRENT_TIMESTAMP
  );
END;

-- Drop and recreate the update trigger with simpler logic
DROP TRIGGER IF EXISTS mirror_update_teams;
select * from teams_history;

CREATE TRIGGER IF NOT EXISTS mirror_update_teams 
AFTER UPDATE ON teams
FOR EACH ROW
WHEN NEW.name != OLD.name 
   OR NEW.acronym != OLD.acronym 
   OR NEW.avatar != OLD.avatar 
   OR NEW.wins != OLD.wins 
   OR NEW.losses != OLD.losses 
   OR NEW.games_won != OLD.games_won 
   OR NEW.games_lost != OLD.games_lost 
   OR NEW.points_scored != OLD.points_scored 
   OR NEW.points_scored_against != OLD.points_scored_against 
   OR NEW.division_id != OLD.division_id 
   OR NEW.status != OLD.status 
   OR NEW.payment_status != OLD.payment_status
   OR NEW.join_password != OLD.join_password
BEGIN
    UPDATE teams_history
    SET 
        name = NEW.name,
        acronym = NEW.acronym,
        avatar = NEW.avatar,
        wins = NEW.wins,
        losses = NEW.losses,
        games_won = NEW.games_won,
        games_lost = NEW.games_lost,
        points_scored = NEW.points_scored,
        points_scored_against = NEW.points_scored_against,
        division_id = NEW.division_id,
        status = NEW.status,
        payment_status = NEW.payment_status,
        join_password = NEW.join_password
    WHERE team_id = NEW.id 
    AND season_id = NEW.season_id;
END;

drop trigger if exists mirror_new_season;
CREATE TRIGGER IF NOT EXISTS mirror_new_season
AFTER UPDATE ON teams 
FOR EACH ROW
WHEN NEW.season_id != OLD.season_id
BEGIN
  INSERT INTO teams_history (
    team_id, name, acronym, avatar, wins, losses, games_won, games_lost,
    points_scored, points_scored_against, division_id, region_id, season_id,
    is_1v1, status, payment_status, join_password, created_at
  )
  VALUES (
    NEW.id, NEW.name, NEW.acronym, NEW.avatar, NEW.wins, NEW.losses, NEW.games_won, NEW.games_lost,
    NEW.points_scored, NEW.points_scored_against, NEW.division_id, NEW.region_id, NEW.season_id,
    NEW.is_1v1, NEW.status, NEW.payment_status, NEW.join_password, CURRENT_TIMESTAMP
  );
END;

UPDATE users SET permission_level = 3 WHERE steam_id = 76561198082657536;
INSERT INTO `moderators` (`steam_id`)VALUES ('76561198082657536');
INSERT INTO `users` (`steam_id`)VALUES ('76561198049311931');
UPDATE users SET permission_level = 3 WHERE steam_id = 76561199668472297;
INSERT INTO `moderators` (`steam_id`)VALUES ('76561199668472297');
UPDATE users SET permission_level = 3 WHERE steam_id = 76561198049311931;
INSERT INTO `moderators` (`steam_id`)VALUES ('76561198049311931');
select * from users;
INSERT INTO `users` (
    `steam_id`, 
    `steam_username`, 
    `permission_level`, 
    `ban_status`, 
    `name_override`
) VALUES (
    '76561198049311931', 
    'Stiggy', 
    3, 
    0, 
    0
);
