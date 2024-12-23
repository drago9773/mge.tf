import express from 'express';
import { db } from '../db.ts';
import { users, teams, divisions, players_in_teams, seasons, discord } from '../schema.ts';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/player_page/:steamid', async (req, res) => {
    // user
    const userSteamId = req.session?.user?.steamid;
    // player whos page the user is on
    const playerSteamId = req.params.steamid;
    
    try {
        const user = await db.select().from(users).where(eq(users.steamId, playerSteamId)).get();
        let owner = 0;
        if (userSteamId == playerSteamId){
            owner = 1;
        }
        if (!user) {
            const name = req.query.name;
            console.log("player steam id: ", playerSteamId)
            res.render('layout', { title: 'Player not found', body: 'empty_player_page', announcements: [], playerSteamId, name, session: req.session });
        } else {
            const teamsForPlayer = await db
                .select({
                    teamId: players_in_teams.teamId,
                    startedAt: players_in_teams.startedAt,
                    leftAt: players_in_teams.leftAt,
                    teamName: teams.name,
                    division: divisions.name, 
                    season: seasons.id,
                    wins: teams.wins,
                    losses: teams.losses,
                    is1v1: teams.is1v1
                })
                .from(players_in_teams)
                .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
                .innerJoin(divisions, eq(teams.divisionId, divisions.id))
                .innerJoin(seasons, eq(teams.seasonNo, seasons.id))
                .where(eq(players_in_teams.playerSteamId, playerSteamId));

            const discordInfo = await db.select().from(discord).where(eq(discord.playerSteamId, playerSteamId)).get();

            res.render('layout', { 
                body: 'player_page', 
                announcements: [],
                title: user.steamUsername, 
                user, 
                teamsForPlayer,
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