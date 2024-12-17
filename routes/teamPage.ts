import express from 'express';
import { db } from '../db.ts';
import { users, teams, regions, divisions, seasons, matches, arenas, players_in_teams, pending_players, teamname_history } from '../schema.ts';
import { eq, and} from 'drizzle-orm';

const router = express.Router();

router.get('/teams', async (req, res) => {
    try {
        const allTeams = await db.select().from(teams);

        res.render('layout', {
            title: 'Teams',
            body: 'teams',
            teams: allTeams,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/team_page/:teamid', async (req, res) => {
    const teamid = Number(req.params.teamid);

    try {
        const team = db.select().from(teams).where(eq(teams.id, teamid)).get();
        
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
        const allTeamnameHistory = await db.select().from(teamname_history);
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
        let request = 0;
        if (req.session?.user) {
            const userSteamId = req.session.user.steamid;
                const existingRequest = await db
                .select()
                .from(pending_players)
                .innerJoin(teams, eq(pending_players.teamId, teams.id))
                .where(and(
                    eq(pending_players.playerSteamId, userSteamId),
                    eq(pending_players.teamId, teamid)
                ))
                .get();

            if (existingRequest) {
                request = 1;
            }
        }  
        const pendingPlayerExists = await db
                .select()
                .from(pending_players)
                .where(and(
                    eq(pending_players.teamId, teamid)
                ))
                .get();
        
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
            teamname_history: allTeamnameHistory,
            existing_request: request,
            pending_player_exists: pendingPlayerExists,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/join_team/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamid = Number(req.params.teamid);
        const userSteamId = req.session.user.steamid;
        try {
            const team = db.select().from(teams).where(eq(teams.id, teamid)).get();
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
            console.error('Error querying database: ' + (err as Error).message);
            res.status(500).send('Internal Server Error');
        }
    } else {
        res.status(401).send('Please sign in');
    }
});

router.post('/join_team', async (req, res) => {
    if (req.session?.user) {
        const userSteamId = req.session.user.steamid;
        const { teamPassword, teamId } = req.body;

        try {
            const team = await db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            const existingRequest = await db
                .select()
                .from(pending_players)
                .innerJoin(teams, eq(pending_players.teamId, teams.id))
                .where(and(
                    eq(pending_players.playerSteamId, userSteamId),
                    eq(pending_players.teamId, teamId)
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
                return res.redirect(`/team_page/${teamId}`);
            } else {
                return res.status(403).send('Incorrect password');
            }
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

router.post('/leave_team/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        const userSteamId = req.session.user.steamid;

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
                .where(and(
                    eq(players_in_teams.playerSteamId, userSteamId),
                    eq(players_in_teams.teamId, teamId)
                ));

            const remainingPlayers = await db.select()
                .from(players_in_teams)
                .where(and(
                    eq(players_in_teams.teamId, teamId),
                    eq(players_in_teams.active, 1)
                )).get();

            if (!remainingPlayers) {
                await db.update(teams)
                    .set({ status: -1 })
                    .where(eq(teams.id, teamId));
            }

            return res.redirect(`/`);
        } catch (err) {
            console.error('Error querying database: ', err);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

router.post('/remove_request/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        const userSteamId = req.session.user.steamid;
        try {
            const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            await db.delete(pending_players)
                .where(
                    and(
                        eq(pending_players.playerSteamId, userSteamId),
                        eq(pending_players.teamId, teamId)
                    )
                );

            return res.redirect(`/team_page/${teamId}`);
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

router.post('/toggle_team/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        try {
            const team = await db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }
            let numPlayers = 0; 
            if (team.status === 0) {
                const playersInTeam = await db.select().from(players_in_teams)
                    .where(eq(players_in_teams.teamId, teamId)).all();
                numPlayers = playersInTeam.length;
            }
            const newStatus = team.status === 0 ? 1 : 0;
            const result = await db.update(teams)
                .set({ status: newStatus })
                .where(eq(teams.id, teamId));

            if (result.changes === 0) {
                return res.status(404).send('Failed to update team status');
            }

            return res.redirect(`/team_page/${teamId}`);
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

export default router;