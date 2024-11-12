import express from 'express';
import { db } from '../db.ts';
import { users, moderators, teams, regions, divisions, seasons, matches, arenas, games, players_in_teams, pending_players, teamname_history } from '../schema.ts';
import { eq, sql, and} from 'drizzle-orm';

const router = express.Router();

router.get('/match_page/:matchid', async (req, res) => {
    const matchid = Number(req.params.matchid);

    try {
        const match = db.select().from(matches).where(eq(matches.id, matchid)).get();
        
        if (!match) {
            res.status(404).send('Match not found');
            return;
        }
        const allTeams = db.select().from(teams);
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
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;