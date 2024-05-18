const express = require("express");
const path = require('path');
const bodyParser = require("body-parser");
const SteamAuth = require("node-steam-openid");
const session = require('express-session');
const sqlite3 = require('sqlite3').verbose();
const SteamID = require('steamid');

const app = express();
app.use(express.json());

app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));

const eloDb = new sqlite3.Database('sourcemod-local.sq3', (err) => {
    if (err) {
        console.error('cannot open elo database');
    }
});

// user database
const db = new sqlite3.Database('users.db', (err) => {
    if (err) {
        console.error("Error opening database: " + err.message);
    } else {
        db.run(`CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_id TEXT NOT NULL,
            steam_username TEXT NOT NULL
        )`, (err) => {
            if (err) {
                console.error("Error creating users table: " + err.message);
            }
        });
    }
});

app.get('/', (req, res) => {
    const result = eloDb.all('SELECT * FROM mgemod_stats ORDER BY rating DESC', [], (err, rows) => {
        if (err) {
            console.error("Error querying database: " + err.message);
            res.status(500).send("Internal Server Error");
        } else {
            res.render('index', { session: req.session, elo: rows });
        }
    });
});

const API_KEY = '2C7E4CDF46C4D4FB5875A8E6E040BFC0';
const domain = process.env.DOMAIN || 'http://localhost:3005/';

const steam = new SteamAuth({
    realm: domain,
    returnUrl: domain + 'verify',
    apiKey: API_KEY,
});

app.get('/init-openid', async (req, res) => {
    const redirectUrl = await steam.getRedirectUrl();
    return res.redirect(redirectUrl);
});

app.get('/verify', async (req, res) => {
    try {
        const user = await steam.authenticate(req);
        req.session.user = user;

        // check if first time login
        db.get('SELECT * FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
            if (err) {
                console.error("Error querying database: " + err.message);
            } else if (!row) {
                // add if first time
                db.run('INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES (?, ?, ?)', [user.steamid, user.username, user.avatar.small], (err) => {
                    if (err) {
                        console.error("Error inserting into database: " + err.message);
                    }
                });
            }
        });
    } catch (err) {
        console.error("Authentication error: " + err.message);
    }
    return res.redirect('/');
});

app.get('/player_page/:steamid', (req, res) => {
    const qid = req.params.steamid;
    const steamid = new SteamID(qid).getSteamID64();

    db.get('SELECT * FROM users WHERE steam_id = ?', [steamid], (err, row) => {
        if (err) {
            console.error("Error querying database: " + err.message);
            res.status(500).send("Internal Server Error");
        } else if (!row) {
            const name = req.query.name;
            res.render('empty_player_page', { steamid, name });
        } else {
            res.render('player_page', { user: row });
        }
    });
});

app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error("Error querying database: " + err.message);
            res.status(500).send("Internal Server Error");
        } else {
            res.render('users', { users: rows });
        }
    });
});

app.get('/load', (req, res) => {
    const { page } = req.query;
    if (page === 'main') {
        eloDb.all('SELECT * FROM mgemod_stats ORDER BY rating DESC', [], (err, rows) => {
            if (err) {
                console.error("Error querying database: " + err.message);
                res.status(500).send("Internal Server Error");
            } else {
                return res.render('main', { elo: rows });
            }
        });
    } else {
        res.render(page);
    }
});

app.get('/logout', (req, res) => {
    req.session = null;
    return res.redirect('/');
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    console.log(`Service endpoint = http://localhost:${PORT}`);
});
