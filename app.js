//TODO
//Team editing,
////team name history
////ownership transfer/'leave' option
////previous team records?
//Logging team history (just keep player_in_teams old tables instead of deleting)
//'match' (team vs team) page, agreeing on date
//Disperse app.js
//display request button

//Turn users/players in teams back to text and not integer
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
import editTeamRoutes from './routes/editTeam.js';
// import teamRoutes from './routes/createTeam.js';
import { db, eloDb } from './db.js';
import { steamId64FromSteamId32 } from './helpers/steamid.js';
import { users, moderators, teams, regions, divisions, seasons, matches, arenas, games, players_in_teams,pending_players } from './schema.js';
import { eq, sql, and} from 'drizzle-orm';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SEASON_ID = 1;


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
app.use('/', editTeamRoutes);
app.use('/moderation', moderatorRoutes);
// app.use('/1v1signup', teamRoutes);
// app.use('/2v2signup', teamRoutes);

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

app.get('/signup', async (req, res) => {
    const allTeams = await db.select().from(teams);
    const allDivisions = await db.select().from(divisions);
    const allSeasons = await db.select().from(seasons);
    const allRegions = await db.select().from(regions);
    

    res.render('layout', {
        body: 'signup',
        title: 'Signup',
        session: req.session,
        teams: allTeams,
        divisions: allDivisions,
        seasons: allSeasons,
        regions: allRegions,
    });
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

app.post('/team_signup', async (req, res) => {
    const { name, division_id, region_id, join_password, is_1v1, permission_level } = req.body;
    const player_steam_id = req.session.user.steamid;

    try {
        // check if they are in a 1v1/2v2 team and if active
        const existingTeam = await db
        .select()
        .from(players_in_teams)
        .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
        .where(and(
            eq(players_in_teams.playerSteamId, player_steam_id), 
            eq(teams.is1v1, is_1v1),
            eq(players_in_teams.active, 1)
        ))
        .get();
    

        if (existingTeam) {
            if (is_1v1 == 1) {
                return res.status(400).send('Error: You are already in a 1v1 team.');
            } else {
                return res.status(400).send('Error: You are already in a 2v2 team.');
            }
        }

        const result = await db.insert(teams).values({
            name, 
            divisionId: division_id, 
            regionId: region_id, 
            seasonNo: SEASON_ID, 
            is1v1: is_1v1, 
            joinPassword: join_password
        });

        const team_id = result.lastInsertRowid;

        await db.insert(players_in_teams).values({
            playerSteamId: player_steam_id, 
            teamId: team_id, 
            permissionLevel: permission_level
        });

        res.redirect('/signup');
    } catch (err) {
        console.error('Error creating team or adding player:', err);
        res.status(500).send('Internal Server Error');
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
            const teamsForPlayer = await db
                .select({
                    teamId: players_in_teams.teamId,
                    startedAt: players_in_teams.startedAt,
                    leftAt: players_in_teams.leftAt,
                    teamName: teams.name,
                    division: divisions.name, 
                    wins: teams.wins,
                    losses: teams.losses,
                    is1v1: teams.is1v1
                })
                .from(players_in_teams)
                .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
                .innerJoin(divisions, eq(teams.divisionId, divisions.id))
                .where(eq(players_in_teams.playerSteamId, steamid));

            res.render('layout', { 
                body: 'player_page', 
                title: user.steamUsername, 
                user, 
                teamsForPlayer,
                session: req.session 
            });
        }
    } catch (err) {
        console.error('Error querying database: ' + err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/team_page/:teamid', async (req, res) => {
    const teamid = req.params.teamid;

    try {
        const team = await db.select().from(teams).where(eq(teams.id, teamid)).get();
        
        if (!team) {
            res.status(404).send('Team not found');
            return;
        }

        const homeMatches = await db.select().from(matches).where(eq(matches.homeTeamId, teamid));
        const awayMatches = await db.select().from(matches).where(eq(matches.awayTeamId, teamid));
        const teamMatches = [...homeMatches, ...awayMatches];
        const allUsers = await db.select().from(users);
        const allTeams = await db.select().from(teams);
        const allArenas = await db.select().from(arenas);
        const allDivisions = await db.select().from(divisions);
        const allSeasons = await db.select().from(seasons);
        const allRegions = await db.select().from(regions);
        const allPlayersInTeams = await db.select({
            playerSteamId: players_in_teams.playerSteamId, 
            teamId: players_in_teams.teamId, 
            active: players_in_teams.active,
            permissionLevel: players_in_teams.permissionLevel,
            startedAt: players_in_teams.startedAt,
            leftAt: players_in_teams.leftAt    
        })
        .from(players_in_teams)
        .innerJoin(users, eq(players_in_teams.playerSteamId, users.steamId))
        .innerJoin(teams, eq(players_in_teams.teamId, teams.id));
    
        // const existingRequest = null;
        // if (req.session?.user) {
        //     const userSteamId = req.session.user.steamid;
        // }
        // const existingRequest = await db
        //         .select()
        //         .from(pending_players)
        //         .innerJoin(teams, eq(pending_players.teamId, teams.id))
        //         .where(and(
        //             eq(pending_players.playerSteamId, userSteamId),
        //         ))
        //         .get();
        // }
        // console.log(existingRequest/*  */);
        res.render('layout', {
            body: 'team_page',
            title: team.name,
            users: allUsers,
            team: team,
            teams: allTeams,
            arenas: allArenas,
            matches: teamMatches,
            divisions: allDivisions,
            seasons: allSeasons,
            regions: allRegions,   
            players_in_teams: allPlayersInTeams,  
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ' + err.message);
        res.status(500).send('Internal Server Error');
    }
});

app.get('/match_page/:matchid', async (req, res) => {
    const matchid = req.params.matchid;

    try {
        const match = await db.select().from(matches).where(eq(matches.id, matchid)).get();
        
        if (!match) {
            res.status(404).send('Match not found');
            return;
        }
        const allTeams = await db.select().from(teams);
        const allArenas = await db.select().from(arenas);
        const allDivisions = await db.select().from(divisions);
        const allSeasons = await db.select().from(seasons);
        const allRegions = await db.select().from(regions);
        const allGames = await db.select().from(games);

        res.render('layout', {
            body: 'match_page',
            title: match.id,
            match,
            teams: allTeams,
            arenas: allArenas,
            divisions: allDivisions,
            seasons: allSeasons,
            regions: allRegions,
            games: allGames,            
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ' + err.message);
        res.status(500).send('Internal Server Error');
    }
});
app.get('/join_team/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamid = req.params.teamid;
        const userSteamId = req.session.user.steamid;
        try {
            const team = await db.select().from(teams).where(eq(teams.id, teamid)).get();
            if (!team) {
                res.status(404).send('Team not found');
                return;
            }

            if (team.is1v1 === 1) {
                return res.status(403).send('This team is for 1v1 matches only. You cannot join.');
            }

            const playerIn2v2Team = await db
            .select()
            .from(players_in_teams)
            .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
            .where(and(
                eq(players_in_teams.playerSteamId, userSteamId),
                eq(teams.is1v1, 0),
                eq(players_in_teams.active, 1) 
            ))
            .get();
        
            if (playerIn2v2Team) {
                return res.status(400).send('Already in a 2v2 team');
            }

            res.render('layout', {
                body: 'join_team',
                title: "Join Team",
                team: team,
                session: req.session
            });
        } catch (err) {
            console.error('Error querying database: ' + err.message);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(401).send('Please sign in');
    }
});

app.post('/join_team', async (req, res) => {
    if (req.session?.user) {
        const userSteamId = req.session.user.steamid;
        const { teamPassword, teamId } = req.body;

        try {
            const team = await db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            // const existingRequest = await db
            //     .select()
            //     .from(pending_players)
            //     .where(eq(pending_players.playerSteamId, userSteamId))
            //     .where(eq(pending_players.teamId, teamId))
            //     .get();

            const existingRequest = await db
                .select()
                .from(pending_players)
                .innerJoin(teams, eq(pending_players.teamId, teams.id))
                .where(and(
                    eq(pending_players.playerSteamId, userSteamId),
                ))
                .get();

            if (existingRequest) {
                return res.status(400).send('You have already requested to join this team.');
            }

            if (team.joinPassword === teamPassword) {
                await db.insert(pending_players).values({
                    playerSteamId: userSteamId,
                    teamId: teamId,
                });
                return res.redirect('/');
            } else {
                return res.status(403).send('Incorrect password');
            }
        } catch (err) {
            console.error('Error querying database: ' + err.message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

app.post('/leave_team/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = req.params.teamid; // Get teamId from URL parameters
        const userSteamId = req.session.user.steamid; // Get user Steam ID from session
        
        try {
            const team = await db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
            await db.update(players_in_teams)
            .set({
                active: 0,
                permissionLevel: -2,
                leftAt: currentDateTime
            })
            .where(
                and(
                    eq(players_in_teams.playerSteamId, userSteamId),
                    eq(players_in_teams.teamId, teamId)
                )
            );

            return res.redirect('/'); 
        } catch (err) {
            console.error('Error querying database: ' + err.message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
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

app.get('/teams', async (req, res) => {
    try {
        const allTeams = await db.select().from(teams);

        res.render('layout', {
            title: 'Teams',
            body: 'teams',
            teams: allTeams,
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