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

CREATE TABLE IF NOT EXISTS moderators(
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            FOREIGN KEY (user_id) REFERENCES users(id)
);

UPDATE users SET permission_level = 3 WHERE steam_id = 76561198082657536;

SELECT users.steam_id
FROM moderators
JOIN users ON moderators.user_id = users.id;

select posts.id FROM posts;

