import express from 'express';
import { db } from '../db.js';
import { users, teams, divisions, players_in_teams, seasons } from '../schema.js';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.get('/player_page/:steamid', async (req, res) => {
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
                    season: seasons.id,
                    wins: teams.wins,
                    losses: teams.losses,
                    is1v1: teams.is1v1
                })
                .from(players_in_teams)
                .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
                .innerJoin(divisions, eq(teams.divisionId, divisions.id))
                .innerJoin(seasons, eq(teams.seasonNo, seasons.id))
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

export default router;