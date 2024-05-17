-- Create the users table with steam_id and steam_username
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT NOT NULL,
    steam_username TEXT NOT NULL,
    steam_avatar TEXT -- Store the profile picture data as a BLOB (Binary Large Object)
);
-- Create the forums table
CREATE TABLE IF NOT EXISTS forums (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL
);

-- Create the messages table
CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    content TEXT NOT NULL
);

-- Insert steam_id and steam_username into the users table
INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES ('example_steam_id', 'example_username', 'https://avatars.cloudflare.steamstatic.com/6539ac9458157152a788bf01b935a7287b300337_full.jpg');

-- Insert forum into the forums table
INSERT INTO forums (title, description) VALUES ('Example Forum', 'This is an example forum description.');

-- Select all usernames from the users table
SELECT steam_username FROM users;

-- Select all forums from the forums table
SELECT title, description FROM forums;
