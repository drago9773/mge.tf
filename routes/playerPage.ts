import express from 'express';
import { db } from '../db.ts';
import { users, teams, teams_history, divisions, players_in_teams, seasons, discord } from '../schema.ts';
import { eq, and } from 'drizzle-orm';

const router = express.Router();

router.get('/player_page/:steamid', async (req, res) => {
    // user
    const userSteamId = req.session?.user?.steamid;
    // player whos page the user is on
    const playerSteamId = req.params.steamid;
    
    try {
        const user = await db.select().from(users).where(eq(users.steamId, playerSteamId)).get();
        let owner = userSteamId == playerSteamId ? 1 : 0;

        if (!user) {
            const name = req.query.name;
            console.log("player steam id: ", playerSteamId)
            res.render('layout', { title: 'Player not found', body: 'empty_player_page', announcements: [], playerSteamId, name, session: req.session });
        } else {
            // Get current active teams
            const currentTeams = await db
                .select({
                    teamId: players_in_teams.teamId,
                    startedAt: players_in_teams.startedAt,
                    leftAt: players_in_teams.leftAt,
                    teamName: teams.name,
                    division: divisions.name, 
                    seasonNum: seasons.seasonNum,
                    wins: teams.wins,
                    losses: teams.losses,
                    is1v1: teams.is1v1,
                    active: players_in_teams.active
                })
                .from(players_in_teams)
                .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
                .innerJoin(divisions, eq(teams.divisionId, divisions.id))
                .innerJoin(seasons, eq(teams.seasonId, seasons.id))
                .where(eq(players_in_teams.playerSteamId, playerSteamId));

            // Get historical teams
            const historicalTeams = await db
                .select({
                    teamId: teams_history.teamId,
                    startedAt: players_in_teams.startedAt,
                    leftAt: players_in_teams.leftAt,
                    teamName: teams_history.name,
                    division: divisions.name,
                    seasonNum: seasons.seasonNum,
                    wins: teams_history.wins,
                    losses: teams_history.losses,
                    is1v1: teams_history.is1v1,
                    active: players_in_teams.active
                })
                .from(players_in_teams)
                .innerJoin(teams_history, eq(players_in_teams.teamId, teams_history.teamId))
                .innerJoin(divisions, eq(teams_history.divisionId, divisions.id))
                .innerJoin(seasons, eq(teams_history.seasonId, seasons.id))
                .where(and(
                    eq(players_in_teams.playerSteamId, playerSteamId),
                    eq(players_in_teams.active, 0)
                ));

            // Reverse the sort order to show newest teams first
            // Add null check for date comparison
            const allTeams = [...currentTeams, ...historicalTeams]
                .sort((a, b) => {
                    if (a.seasonNum !== b.seasonNum) {
                        return a.seasonNum - b.seasonNum;
                    }
                    // Handle potential null values in startedAt
                    const dateA = a.startedAt ? new Date(a.startedAt).getTime() : 0;
                    const dateB = b.startedAt ? new Date(b.startedAt).getTime() : 0;
                    return dateA - dateB;
                });

            const discordInfo = await db.select().from(discord)
                .where(eq(discord.playerSteamId, playerSteamId))
                .get();

            res.render('layout', { 
                body: 'player_page', 
                announcements: [],
                title: user.steamUsername, 
                user, 
                teamsForPlayer: allTeams,
                discordInfo,
                owner,
                session: req.session 
            });
        }
    } catch (err) {
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;