CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT NOT NULL,
    steam_username TEXT NOT NULL,
    steam_avatar TEXT
);

CREATE TABLE IF NOT EXISTS forums (
    forums_id INTEGER PRIMARY KEY AUTOINCREMENT,
    steam_id TEXT,
    steam_username TEXT,
    steam_avatar TEXT,
    title TEXT,
    content TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (steam_id) REFERENCES users(steam_id)
);

INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES ('?', '?', '?');
INSERT INTO forums (steam_id, steam_username, steam_avatar, title, content) VALUES ('?', '?', '?', '?', '?');

SELECT steam_username FROM users;

SELECT forums_id, steam_id, title, content FROM forums;