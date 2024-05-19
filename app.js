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
// user database
const users_db = new sqlite3.Database('users.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        users_db.run(`CREATE TABLE IF NOT EXISTS users (
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
// forums database
const forums_db = new sqlite3.Database('forums.db', sqlite3.OPEN_READWRITE, (err) => {
    if (err) {
        console.error(err.message);
    } else {
        forums_db.run(`CREATE TABLE IF NOT EXISTS forums (
            forums_id INTEGER PRIMARY KEY AUTOINCREMENT,
            steam_id TEXT NOT NULL,
            steam_username TEXT NOT NULL,
            steam_avatar TEXT
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (steam_id) REFERENCES users(steam_id)
        )`, (err) => {
            if (err) {
                console.error("Error creating forums table: " + err.message);
            }
        });
    }
});

// Define route to fetch and display usernames
app.post('/postContent', (req, res) => {
    const { content, title } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content || !title) {
        return res.status(400).json({ error: 'Content and title are required' });
    }

    forums_db.run('INSERT INTO forums (steam_id, steam_username, steam_avatar, title, content, created_at) VALUES (?, ?, ?, ?, ?, ?)', 
        [user.steamid, user.username, user.avatar.small, title, content, new Date().toISOString().slice(0, 16)], 
        (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to post content.' });
            } else {
                console.log(`Forum Post "${content}" saved to the database.`);
                return res.status(200).json({ message: 'Post saved successfully.' });
            }
        }
    );
});

// Define route to fetch and display forums
app.get('/forums', (req, res) => {
    const sql = 'SELECT forums_id, steam_id, steam_username, steam_avatar, title, content, created_at FROM forums';
    forums_db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Failed to fetch post.' });
        } else {
            res.render('forums', { forums: rows });
        }
    });
});

// Define route to remove a post
app.post('/remove_post', (req, res) => {
    const postId = req.body.post_id; // Get the post ID from the request
    // Perform deletion in the database based on postId
    const sql = 'DELETE FROM forums WHERE forums_id = ?';
    forums_db.run(sql, [postId], (err) => {
        if (err) {
            console.error(err.message);
            res.status(500).json({ error: 'Failed to remove post.' });
        } else {
            res.redirect('/'); // Redirect back to the forums page
        }
    });
});


const eloDb = new sqlite3.Database('sourcemod-local.sq3', (err) => {
    if (err) {
        console.error('cannot open elo database');
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
		users_db.get('SELECT * FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
			if (err) {
				console.error("Error querying database: " + err.message);
			} else if (!row) {
				// add if first time
				users_db.run('INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES (?, ?, ?)', [user.steamid, user.username, user.avatar.small], (err) => {
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
    const steamid = req.params.steamid;
    users_db.get('SELECT * FROM users WHERE steam_id = ?', [steamid], (err, row) => {
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
    users_db.all('SELECT * FROM users', [], (err, rows) => {
        if (err) {
            console.error("Error querying database: " + err.message);
            res.status(500).send("Internal Server Error");
        } else {
            res.render('users', { users: rows });
        }
    });
});

app.get('/click_user_steamid')

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
    req.session.destroy(err => {
        if (err) {
            console.error("Error destroying session: " + err.message);
        }
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    console.log(`Service endpoint = http://localhost:${PORT}`);
});
