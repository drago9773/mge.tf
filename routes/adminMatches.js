import express from 'express';
import { db } from '../db.ts';
import { teams, matches, games } from '../schema.ts';
import { eq, sql, and } from 'drizzle-orm';

const router = express.Router();

router.post('/admin/create_match_set', async (req, res) => {
    const { teams, boSeries, weekNo, seasonNo, arenaId, matchDateTime } = req.body;
    console.log(arenaId);
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

export default router;
