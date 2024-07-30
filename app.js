import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import { renderFile } from 'ejs';
import { fileURLToPath } from 'url';
import forumPostRoutes from './routes/forumPosts.js';
import steamRoutes from './routes/steamAuth.js';
import signupRoutes from './routes/signup.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin.js';
import moderatorRoutes from './routes/moderation.js';
import { db, eloDb } from './db.js';
import { steamId64FromSteamId32 } from './helpers/steamid.js';
import { users, moderators } from './schema.js';
import { eq, sql } from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

app.engine('html', renderFile);
app.set('view engine', 'ejs');

app.use(express.static(path.join(__dirname, 'views')));

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
// FIXME: CHANGE THIS TO ENV!!!
app.use(session({
    secret: '4d20d22d-65b9-429e-9f4a-b8e6f8cf866bx',
    resave: false,
    saveUninitialized: true
}));

app.use('/', forumPostRoutes);
app.use('/', steamRoutes);
app.use('/signup', signupRoutes);
app.use('/api', apiRoutes);
app.use('/', adminRoutes);
app.use('/moderation', moderatorRoutes);

// TODO: Cache the elo stuff and cron job it
app.get('/', async (req, res) => {
    try {
        const players = eloDb.all(sql`
            SELECT * 
            FROM mgemod_stats
            ORDER BY rating DESC
        `)
        const updatedPlayers = players.map(player => ({
            ...player,
            steamid: steamId64FromSteamId32(player.steamid)
        }));
        res.render('layout', { body: 'index', title: 'home', session: req.session, elo: updatedPlayers });
    } catch (err) {
        console.error('Error querying database: ' + err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/signup', (req, res) => {
    res.render('layout', { title: 'Signup', body: 'signup', session: req.session });
});


app.post('/signup', async (req, res) => {
    if (req.session?.user) {
        try {
            await db.update(users)
                .set({ isSignedUp: 1 })
                .where(eq(users.steamId, req.session.user.steamid));
            req.session.user.isSignedUp = 1;
            res.redirect('/signup');
        } catch (error) {
            console.error('Error updating user signup status:', error);
            res.status(500).send('An error occurred during signup');
        }
    } else {
        res.status(401).send('Unauthorized');
    }
});

app.get('/player_page/:steamid', async (req, res) => {
    const steamid = req.params.steamid;
    try {
        const user = await db.select().from(users).where(eq(users.steamId, steamid)).get();
        if (!user) {
            const name = req.query.name;
            res.render('layout', { title: 'Player not found', body: 'empty_player_page', steamid, name, session: req.session });
        } else {
            res.render('layout', { body: 'player_page', title: user.steamUsername, user, session: req.session });
        }
    } catch (err) {
        console.error('Error querying database: ' + err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/users', async (req, res) => {
    try {
        const allUsers = await db.select().from(users);
        const moderatorIds = await db.select().from(moderators);

        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        const usersWithModStatus = allUsers.map(user => ({
            ...user,
            isModerator: moderatorSet.has(user.steamId)
        }));

        res.render('layout', {
            title: 'Users',
            body: 'users',
            users: allUsers,
            mods: usersWithModStatus,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ' + err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/2v2cup', (req, res) => {
    res.render('2v2cup');
});

app.get('/discord', (req, res) => {
    const discordInviteLink = 'https://discord.gg/j6kDYSpYbs';
    res.redirect(discordInviteLink);
});

app.get('/league', (req, res) => {
    res.render('layout', { title: 'League', body: 'league', session: req.session });
});

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