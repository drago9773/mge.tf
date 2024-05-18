-- create user database 
CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT NOT NULL,
    steam_username TEXT NOT NULL,
    steam_avatar TEXT
)

-- insert steam ID, steam username, and steam avatar
INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES ('steam ID', 'steam username', 'https://avatars.cloudflare.steamstatic.com/6539ac9458157152a788bf01b935a7287b300337_full.jpg');

-- view all steam usernames
SELECT steam_username FROM users;