import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import sqlite3 from 'sqlite3';
import { renderFile } from 'ejs';
import { fileURLToPath } from 'url';
import forumPostRoutes from './routes/forumPosts.js';
import steamRoutes from './routes/steamAuth.js';
import signupRoutes from './routes/signup.js';
import apiRoutes from './routes/api.js';
import db from './db.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.engine('html', renderFile);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.use(session({
    secret: 'your-secret-key',
    resave: false,
    saveUninitialized: true
}));


app.use('/', forumPostRoutes);
app.use('/', steamRoutes);
app.use('/signup', signupRoutes);
app.use('/api', apiRoutes);

const eloDb = new sqlite3.Database('sourcemod-local.sq3', (err) => {
    if (err) {
        console.error('cannot open elo database');
    }
});

app.get('/', (req, res) => {
    eloDb.all('SELECT * FROM mgemod_stats ORDER BY rating DESC', [], (err, rows) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.render('layout', { body: 'index', title: 'home', session: req.session, elo: rows });
        }
    });
});

app.get('/signup', (req, res) => {
    res.render('layout', { title: 'Signup', body: 'signup', session: req.session });
})


app.get('/player_page/:steamid', (req, res) => {
    const steamid = req.params.steamid;
    db.get('SELECT * FROM users WHERE steam_id = ?', [steamid], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else if (!row) {
            const name = req.query.name;
            res.render('empty_player_page', { steamid, name });
        } else {
            res.render('layout', { body: 'player_page', title: row.steam_username, user: row, session: req.session });
        }
    });
});

app.get('/users', (req, res) => {
    db.all('SELECT * FROM users', [], (err, users) => {
        if (err) {
            console.error('Error querying users: ' + err.message);
            res.status(500).send('Internal Server Error');
            return;
        }
        db.all('SELECT steam_id FROM moderators', [], (err, moderators) => {
            if (err) {
                console.error('Error querying moderators: ' + err.message);
                res.status(500).send('Internal Server Error');
                return;
            }

            const moderatorSet = new Set(moderators.map(m => m.steam_id));

            const usersWithModStatus = users.map(user => ({
                ...user,
                isModerator: moderatorSet.has(user.steam_id)
            }));

            res.render('layout', {
                title: 'Users',
                body: 'users',
                users: usersWithModStatus,
                session: req.session
            });
        });
    });
});

app.get('/click_user_steamid')

app.get('/2v2cup', (req, res) => {
    res.render('2v2cup');
});

app.get('/discord', (req, res) => {
    const discordInviteLink = 'https://discord.gg/j6kDYSpYbs';
    res.redirect(discordInviteLink);
});

app.get('/league', (req, res) => {
    res.render('layout', { title: 'League', body: 'league', session: req.session });
})

app.get('/logout', (req, res) => {
    req.session.destroy(err => {
        if (err) {
            console.error('Error destroying session: ' + err.message);
        }
        res.redirect('/');
    });
});

const PORT = process.env.PORT || 3005;

app.listen(PORT, () => {
    console.log(`Service endpoint = http://localhost:${PORT}`);
});