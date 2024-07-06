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

        await runQuery(db, `CREATE TABLE IF NOT EXISTS divisions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL)`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS regions (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL)`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS teams (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            record TEXT,
            division_id INTEGER,
            region_id INTEGER,
            season_no INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (division_id) REFERENCES divisions(id),
            FOREIGN KEY (region_id) REFERENCES regions(id))`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS matches (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            home_team_id INTEGER NOT NULL,
            away_team_id INTEGER NOT NULL,
            division_id INTEGER NOT NULL,
            loser_score INTEGER,
            season_no INTEGER NOT NULL,
            week_no INTEGER NOT NULL,
            winner_id INTEGER,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (home_team_id) REFERENCES teams(id),
            FOREIGN KEY (away_team_id) REFERENCES teams(id),
            FOREIGN KEY (division_id) REFERENCES divisions(id),
            FOREIGN KEY (winner_id) REFERENCES teams(id))`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS players (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_id TEXT,
            steam_username TEXT,
            steam_avatar TEXT,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP)`);

        await runQuery(db, `CREATE TABLE IF NOT EXISTS players_in_teams (
            player_id INTEGER,
            team_id INTEGER,
            started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            left_at TIMESTAMP,
            PRIMARY KEY (player_id, team_id, started_at),
            FOREIGN KEY (player_id) REFERENCES users(id),
            FOREIGN KEY (team_id) REFERENCES teams(id))`);

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