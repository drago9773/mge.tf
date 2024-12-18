//TODO: general
    //payment on signup
    //make discord api key thing private

//TODO:
    ////rulebook
    ////playoffs?
    ////FF option

//TODO: admin
    ////automatic match generation equation
    ////SQL injection

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
import { sql, eq, and } from 'drizzle-orm';

import { scheduleTasks } from './views/js/scheduler.ts';

import forumPostRoutes from './routes/forumPosts.ts';
import leagueStandingsRoutes from './routes/leagueStandings.ts';
import steamRoutes from './routes/steamAuth.ts';
import discordRoutes from './routes/discordAuth.ts';
import tournamentsRoutes from './routes/tournaments.ts';
import signupRoutes from './routes/signup.js';
import apiRoutes from './routes/api.ts';
import adminRoutes from './routes/admin.ts';
import adminMatchesRoutes from './routes/adminMatches.js';
import adminDemosRoutes from './routes/adminDemos.js';
import adminPendingPlayersRoutes from './routes/adminPendingPlayers.js';
import adminDashboardRoutes from './routes/adminDashboard.js';
import moderatorRoutes from './routes/moderation.js';
import editTeamRoutes from './routes/editTeam.ts';
import teamPageRoutes from './routes/teamPage.ts';
import playerPageRoutes from './routes/playerPage.ts';
import matchesRoutes from './routes/matches.ts';
import demosRoutes from './routes/demos.ts';
import paypalRoutes from './routes/paypal.ts';

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

scheduleTasks();

app.use('/', forumPostRoutes);
app.use('/', leagueStandingsRoutes);
app.use('/', steamRoutes);
app.use('/', discordRoutes);
app.use('/', tournamentsRoutes);
app.use('/', adminRoutes);
app.use('/', adminMatchesRoutes);
app.use('/', adminDashboardRoutes);
app.use('/', editTeamRoutes);
app.use('/', teamPageRoutes);
app.use('/', matchesRoutes);
app.use('/', playerPageRoutes);
app.use('/', signupRoutes);
app.use('/', demosRoutes);
app.use('/', paypalRoutes);
app.use('/', adminDemosRoutes);
app.use('/', adminPendingPlayersRoutes);
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
        res.render('layout', { 
            body: 'index', 
            title: 'home', 
            session: req.session, 
            elo: updatedPlayers 
        });
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

app.get('/discord', (_req, res) => {
    const discordInviteLink = 'https://discord.gg/j6kDYSpYbs';
    res.redirect(discordInviteLink);
});

app.get('/2v2cup', (_req, res) => { res.render('2v2cup'); });
app.get('/league', (req, res) => { res.render('layout', { title: 'League', body: 'league', session: req.session }); });
app.get('/rulebook', (req, res) => { res.render('layout', { title: 'Rulebook', body: 'rulebook', session: req.session }); });

app.get('/auth/discord', (_req, res) => {
    res
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