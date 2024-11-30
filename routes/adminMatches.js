import express from 'express';
import { db, isAdmin } from '../db.ts';
import { teams, matches, games } from '../schema.ts';
import { eq, sql, and } from 'drizzle-orm';

const router = express.Router();

router.post('/admin/create_match_set', async (req, res) => {
    const { teams, boSeries, weekNo, seasonNo, arenaId, matchDateTime } = req.body;
    try {
        const allTeams = JSON.parse(teams);
        const bestOfSeries = parseInt(boSeries, 10);

        for (let i = 0; i < allTeams.length - 1; i += 2) {
            if (i + 1 < allTeams.length) {
                const home_team_id = allTeams[i].id;
                const away_team_id = allTeams[i + 1].id;

                const match = await db.insert(matches).values({
                    homeTeamId: home_team_id,
                    awayTeamId: away_team_id,
                    seasonNo: seasonNo,
                    weekNo: weekNo,
                    boSeries: bestOfSeries,
                    matchDateTime: matchDateTime,
                    status: 0
                });

                const matchId = Number(match.lastInsertRowid);

                for (let j = 1; j < bestOfSeries + 1; j += 1) {
                    await db.insert(games).values({
                        matchId: matchId,
                        gameNum: j,
                        arenaId: arenaId
                    });
                }
            }
        }

        res.redirect('/admin');
    } catch (error) {
        console.error("Error creating match set:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/match_page/:matchid/update_status', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const steamId = req.session?.user?.steamid;
    const admin = isAdmin(steamId);
    
    const newStatus = Number(req.body.status); 
    
    try {
        const match = await db.select().from(matches).where(eq(matches.id, matchId)).get();
        if (!match) {
            return res.status(404).send('Match not found');
        }

        if (!admin) {
            return res.status(403).send('Unauthorized to update the match status');
        }

        await db.update(matches)
            .set({
                status: newStatus
            })
            .where(eq(matches.id, matchId));

        res.redirect(`/match_page/${matchId}`);
    } catch (err) {
        console.error("Error updating match status:", err);
        res.status(500).send("Internal Server Error");
    }
});


export default router;
