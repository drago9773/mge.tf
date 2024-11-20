//TODO: signup
    ////TOS popup on signup
    ////have div/region actually be the table value

//TODO: admin
    ////assign/approve team division requests from signup
    ////pending players need to be confirmed by staff?

//TODO: match stuff
    ////match comms
    ////request new match date

    //payment on signup

    //link discord

    //a lot of front end touching up

//questions
////do we want a list of viable MGE maps and then arenas associated with each map?

//FUTURE
//1. In admin panel, needs to be a 'commit team history' button to move all teams from current
//season into the teams_history table to preserve name/record/division etc. at the end of each season
/// 1a. Then the players can keep the same team and the record/division can change for next season
/// 1b. Then player_page and team_page will need to be updated to display team history

import express from 'express';
import path from 'path';
import bodyParser from 'body-parser';
import session from 'express-session';
import { renderFile } from 'ejs';
import { fileURLToPath } from 'url';
import { db, eloDb } from './db.ts';
import { steamId64FromSteamId32 } from './helpers/steamid.ts';
import { users, moderators } from './schema.ts';
import { sql} from 'drizzle-orm';

import forumPostRoutes from './routes/forumPosts.ts';
import steamRoutes from './routes/steamAuth.ts';
import signupRoutes from './routes/signup.js';
import apiRoutes from './routes/api.ts';
import adminRoutes from './routes/admin.ts';
import adminMatchesRoutes from './routes/adminMatches.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import moderatorRoutes from './routes/moderation.js';
import editTeamRoutes from './routes/editTeam.ts';
import teamPageRoutes from './routes/teamPage.ts';
import playerPageRoutes from './routes/playerPage.ts';
import matchesRoutes from './routes/matches.ts';

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
app.use('/', adminRoutes);
app.use('/', adminMatchesRoutes);
app.use('/', adminDashboardRoutes);
app.use('/', editTeamRoutes);
app.use('/', teamPageRoutes);
app.use('/', matchesRoutes);
app.use('/', playerPageRoutes);
app.use('/', signupRoutes);
app.use('/api', apiRoutes);
app.use('/moderation', moderatorRoutes);


type Player = {
    rating: number;
    steamid: string;
    name: string;
    wins: number;
    losses: number;
    lastplayed: number;
    hitblip: number;
};

// TODO: Cache the elo stuff and cron job it
app.get('/', async (req, res) => {
    try {
        const players: Player[] = eloDb.all(sql`
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
        console.error('Error querying database: ' + (err as Error).message);
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
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/2v2cup', (_req, res) => {
    res.render('2v2cup');
});

app.get('/discord', (_req, res) => {
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