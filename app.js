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
                  FOREIGN KEY (owner) REFERENCES users(id)
                  FOREIGN KEY (thread) REFERENCES thread(id))`);

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
                    console.error("Error querying database: " + err.message);
                    return res.status(500).send("Internal Server Error");
                }
    const match = moderators.some(moderator => moderatorIds.includes(moderator.steam_id));
    
    if (!match) {
        db.run(`INSERT INTO moderators (user_id)
            SELECT id FROM users WHERE steam_id IN ('76561198082657536', '76561198041183975')`);
    }
    });    
});

// 3 posts per hour, 30 replies
const MAX_POSTS = 3;
const MAX_REPLIES = 30;
// 1 hour
const REFRESH_PERIOD = 3600000;

app.post('/postContent', async (req, res) => {
    const { content, title } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content || !title) {
        return res.status(400).json({ error: 'Content and title are required' });
    }

    console.log(user);
    db.get('SELECT id FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to post content.' });
        }

        const user_id = row.id;

        db.get('SELECT * FROM activity WHERE owner = ?', [user_id], (err, activityRow) => {
            if(err){
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to retrieve activity data.' });
        }

        const current_time = Date.now();
        let threadCount = 0;
        let lastPeriod = current_time;

        if (activityRow) {
            threadCount = activityRow.thread_count;
            lastPeriod = activityRow.period;

            if(current_time - lastPeriod >= REFRESH_PERIOD){
                threadCount = 0;
                lastPeriod = current_time;
            }
        }

        if (threadCount >= MAX_POSTS) {
            console.log('You have reached max numebr of posts')
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later. '})
        }

        db.run('INSERT INTO threads (title, content, owner) VALUES (?, ?, ?)', [title, content, user_id], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to post content.' });
                } else {
                    console.log(`Forum Post "${content}" saved to the database.`);

                    if (activityRow){
                        db.run('UPDATE activity SET thread_count = ?, period = ? WHERE owner = ?', [threadCount + 1, lastPeriod, user_id])
                    } else {
                        db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [1, 0, current_time, user_id]);
                    }

                    return res.status(200).redirect('/forums');
                }
            });
        });
    });
});

const moment = require('moment');

app.get('/forums', (req, res) => {
    const user = req.session.user;
    const session = req.session;

    const sql = `SELECT threads.id as thread_id, threads.*, users.steam_username, users.steam_id, users.steam_avatar 
                 FROM threads 
                 LEFT JOIN users ON threads.owner = users.id 
                 ORDER BY bumped_at DESC`;

    db.all(sql, [], (err, forumRows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch posts.' });
        }

        const forums = forumRows.map(forum => {
            try {
                const createdAt = moment(forum.created_at);
                forum.formatted_date = createdAt.format('MM/DD/YYYY HH:mm:ss');
            } catch (error) {
                console.error('Error formatting date:', error);
            }
            return forum;
        });

        db.all(`SELECT users.*, moderators.id as moderator_id
                FROM moderators
                JOIN users ON moderators.user_id = users.id`, [], (err, moderators) => {
            if (err) {s
                console.error("Error querying database: " + err.message);
                return res.status(500).send("Internal Server Error");
            }

            res.render('forums', { forums: forums, session: session, moderators: moderators });
        });
    });
});


app.post('/posts', (req, res) => {
    const { content, thread_id } = req.body;
    const user = req.session.user;

    console.log(req.body);

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    db.get('SELECT id FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to post content.' });
        }
        const user_id = row.id;

        db.get('SELECT * FROM activity WHERE owner = ?', [user_id], (err, activityRow) => {
                if(err){
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to retrieve activity data.' });
            }
        
        const current_time = Date.now();
        let postCount = 0;
        let lastPeriod = current_time;

        if (activityRow) {
            postCount = activityRow.post_count;
            lastPeriod = activityRow.period;

            if(current_time - lastPeriod >= REFRESH_PERIOD){
                postCount = 0;
                lastPeriod = current_time;
            }
        }

        if (postCount >= MAX_POSTS) {
                console.log('You have reached max numebr of posts')
                return res.status(400).json({ error: 'You have reached the limit of posts. Try again later. '})
            }

        db.run('INSERT INTO posts (content, thread, owner) VALUES (?, ?, ?)', [content, thread_id, user_id], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to post content.' });
                } else {
                    console.log(`Post "${content}" saved to the database.`);

                    if (activityRow){
                        db.run('UPDATE activity SET post_count = ?, period = ? WHERE owner = ?', [postCount + 1, lastPeriod, user_id])
                    } else {
                        db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [1, 0, current_time, user_id]);
                    }

                    return res.status(200).redirect('/forums');
                }
            });
        });
    });
});

app.post('/remove_post', (req, res) => {;
    const postId = req.body.post_id;
    const mod = req.body.is_moderator;
    const owner = req.body.is_owner;

    console.log(owner);
    console.log(mod);
    if (!owner || !mod) {
        return res.status(403).send('Unauthorized');
    }

    const sqlCheckPost = `SELECT * FROM threads WHERE id = ?`;
    db.get(sqlCheckPost, [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Failed to verify post.');
        }

        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const sqlDeletePost = `DELETE FROM threads WHERE id = ?`;
        db.run(sqlDeletePost, [postId], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Failed to delete post.');
            }
            return res.redirect('/');
        });
    });
});

app.post('/remove_reply', (req, res) => {;
    const replyId = req.body.reply_id;
    const mod = req.body.is_moderator;
    const owner = req.body.is_owner;

    console.log(owner);
    console.log(mod);
    console.log(replyId);

    if (!owner || !mod) {
        return res.status(403).send('Unauthorized');
    }

    const sqlCheckPost = `SELECT * FROM posts WHERE id = ?`;
    db.get(sqlCheckPost, [replyId], (err, post) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Failed to verify post.');
        }
 
        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const sqlDeletePost = `DELETE FROM posts WHERE id = ?`;
        console.log("3")
        db.run(sqlDeletePost, [replyId], (err) => {
            console.log("4")
            if (err) {
                console.log("5")
                console.error(err.message);
                return res.status(500).send('Failed to delete post.');
            }
            console.log("6")
            return res.redirect('/');
        });
    });
});

const eloDb = new sqlite3.Database('sourcemod-local.sq3', (err) => {
    if (err) {
        console.error('cannot open elo database');
    }
});

app.get('/', (req, res) => {
    eloDb.all('SELECT * FROM mgemod_stats ORDER BY rating DESC', [], (err, rows) => {
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
    const steamid = req.params.steamid;
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

app.get('/post/:forumid', (req, res) => {
    const session = req.session;
    const forumid = req.params.forumid;

    db.get('SELECT threads.id as thread_id, * FROM threads LEFT JOIN users ON threads.owner = users.id WHERE threads.id = ?', [forumid], (err, row) => {
        if (err) {
            console.error("Error querying database: " + err.message);
            return res.status(500).send("Internal Server Error");
        }

        db.all(`SELECT posts.*, users.steam_username, users.steam_id, users.steam_avatar
            FROM posts LEFT JOIN users ON 
            posts.owner = users.id WHERE thread = ?`, [forumid], (err, posts) => {

            if (err) {
                console.error("Error querying database: " + err.message);
                return res.status(500).send("Internal Server Error");
            }

            db.all(`SELECT users.*, moderators.id as moderator_id
                    FROM moderators
                    JOIN users ON moderators.user_id = users.id`, [], (err, moderators) => {
                if (err) {
                    console.error("Error querying database: " + err.message);
                    return res.status(500).send("Internal Server Error");
                }

                res.render('posts', { session: session, moderators: moderators, posts: posts, thread: row });
            });
        });
    });
});

app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, users) => {
        if (err) {
            console.error("Error querying database: " + err.message);
            res.status(500).send("Internal Server Error");
            return;
        }
        
        db.all(`SELECT users.*, moderators.id as moderator_id
            FROM moderators
            JOIN users ON moderators.user_id = users.id`, [], (err, moderators) => {
            if (err) {
                console.error("Error querying database: " + err.message);
                res.status(500).send("Internal Server Error");
                return;
            }
            
            res.render('users', { users: users, moderators: moderators });
        });
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
