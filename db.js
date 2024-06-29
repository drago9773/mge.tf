import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('users.db', sqlite3.OPEN_READWRITE, async (err) => {
    if (err) {
        console.error(err.message);
    }

    await db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_id TEXT NOT NULL,
            steam_username TEXT NOT NULL)`);

    await db.run(`CREATE TABLE IF NOT EXISTS threads (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  title TEXT NOT NULL,
                  content TEXT NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  bumped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  owner INTEGER NOT NULL,
                  FOREIGN KEY (owner) REFERENCES users(id))`);

    await db.run(`CREATE TABLE IF NOT EXISTS posts (
                  id INTEGER PRIMARY KEY AUTOINCREMENT,
                  content TEXT NOT NULL,
                  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                  thread INTEGER NOT NULL,
                  owner INTEGER NOT NULL,
                  FOREIGN KEY (owner) REFERENCES users(id),
                  FOREIGN KEY (thread) REFERENCES threads(id))`);

    await db.run(`CREATE TABLE IF NOT EXISTS activity (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                thread_count INTEGER NOT NULL,
                post_count INTEGER NOT NULL,
                period INTEGER NOT NULL,
                owner INTEGER NOT NULL,
                FOREIGN KEY (owner) REFERENCES users(id))`);

    await db.run(`CREATE TABLE IF NOT EXISTS moderators (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                FOREIGN KEY (user_id) REFERENCES users(id))`);

    const moderatorIds = ['76561198082657536', '76561198041183975'];
    db.all(`SELECT users.*, moderators.id as moderator_id
                    FROM moderators
                    JOIN users ON moderators.user_id = users.id`, [], (err, moderators) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
        }
        const match = moderators.some(moderator => moderatorIds.includes(moderator.steam_id));

        if (!match) {
            db.run(`INSERT INTO moderators (user_id)
            SELECT id FROM users WHERE steam_id IN ('76561198082657536', '76561198041183975')`);
        }
    });
});

export default db;
