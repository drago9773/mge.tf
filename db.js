import sqlite3 from 'sqlite3';

function runQuery(db, query, params = []) {
    return new Promise((resolve, reject) => {
        db.run(query, params, function (err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

const db = new sqlite3.Database('users.db', sqlite3.OPEN_READWRITE, async (err) => {
    if (err) {
        console.error(err.message);
        return;
    }
    try {
        await runQuery(db, `CREATE TABLE IF NOT EXISTS users (
            steam_id TEXT PRIMARY KEY,
            steam_username TEXT NOT NULL,
            steam_avatar TEXT)`);


        await runQuery(db, `CREATE TABLE IF NOT EXISTS threads (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            bumped_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            owner TEXT NOT NULL,
            FOREIGN KEY (owner) REFERENCES users(steam_id))`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS posts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            thread INTEGER NOT NULL,
            owner TEXT NOT NULL,
            FOREIGN KEY (owner) REFERENCES users(steam_id),
            FOREIGN KEY (thread) REFERENCES threads(id))`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS activity (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            thread_count INTEGER NOT NULL,
            post_count INTEGER NOT NULL,
            period INTEGER NOT NULL,
            owner TEXT NOT NULL,
            FOREIGN KEY (owner) REFERENCES users(steam_id))`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS moderators (
            steam_id TEXT PRIMARY KEY,
            FOREIGN KEY (steam_id) REFERENCES users(steam_id))`);

        const moderatorIds = ['76561198082657536', '76561198041183975'];

        for (const id of moderatorIds) {
            await runQuery(db, 'INSERT OR IGNORE INTO moderators (steam_id) VALUES (?)', [id]);
        }

        console.log('Database setup completed successfully.');
    } catch (error) {
        console.error('Error setting up database:', error);
    }
});

export default db;