import express from 'express';
import { db, isAdmin } from '../db.js';
import { users, teams, matches, divisions, regions, seasons, arenas, games, players_in_teams } from '../schema.js';
import { eq, sql, and } from 'drizzle-orm';

const router = express.Router();

router.post('/admin/create_match_set', async (req, res) => {
    const { teams, boSeries, weekNo, seasonNo } = req.body;
    console.log(req.body);

    try {
        const allTeams = JSON.parse(teams);

        for (let i = 0; i < allTeams.length-1; i += 2) {
            if (i + 1 < allTeams.length) {
                console.log("team at i: ", allTeams[i]);
                const home_team_id = allTeams[i].id;
                const away_team_id = allTeams[i + 1].id;

                const match = await db.insert(matches).values({
                    homeTeamId: home_team_id,
                    awayTeamId: away_team_id,
                    seasonNo: seasonNo,
                    weekNo: weekNo,
                    boSeries: boSeries,
                });
            }
        }

        res.redirect('/admin');
    } catch (error) {
        console.error("Error creating match set:", error);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/submit_match_result', async (req, res) => {
    const { match_id, bo_series } = req.body;

    try {
        const match = await db.select()
            .from(matches)
            .where(eq(matches.id, match_id))
            .then(matches => matches[0]);

        if (!match) {
            console.log('Match not found for match_id:', Number(match_id));
            throw new Error('Match not found');
        }

        const { homeTeamId, awayTeamId } = match;

        let homeWins = 0;
        let awayWins = 0;
        const requiredWins = Math.floor(bo_series / 2) + 1;
        console.log("Request body for match submission:", req.body); 
        for (let i = 1; i <= bo_series; i++) {
            const homeScore = Number(req.body[`game_${i}_home_score`]);
            const awayScore = Number(req.body[`game_${i}_away_score`]);
            const arenaId = Number(req.body[`game_${i}_arena`]);

            if (homeWins >= requiredWins || awayWins >= requiredWins) {
                if ((homeScore === 0) && (awayScore === 0) && !arenaId) { 
                    await db.delete(games)
                    .where(
                        eq(games.id, i)
                    );
                }
            }
            else if (!homeScore || !awayScore || !arenaId) {
                console.log(`Incomplete data for game ${i}: homeScore, awayScore, or arenaId is missing.`);
                return res.status(400).send(`Error: Incomplete data for game ${i}. Please fill out all fields.`);
            }
            else{
                if (homeScore > awayScore) {
                    homeWins++;
                } else {
                    awayWins++;
                }

                const gameData = {
                    matchId: match_id,
                    homeTeamScore: homeScore,
                    awayTeamScore: awayScore,
                    arenaId: arenaId
                };

                await db.insert(games).values(gameData);
            }
        }
 
        if (homeWins > awayWins) {
            await db.update(matches)
                .set({
                    winnerId: awayTeamId,
                    winnerScore: homeWins,
                    loserScore: awayWins
                })
                .where(eq(matches.id, match_id));
            await db.update(teams).set({ wins: sql`${teams.wins} + 1` }).where(eq(teams.id, homeTeamId));
            await db.update(teams).set({ losses: sql`${teams.losses} + 1` }).where(eq(teams.id, awayTeamId));
        } else if (awayWins > homeWins) {
            await db.update(matches)
                .set({
                    winnerId: awayTeamId,
                    winnerScore: awayWins,
                    loserScore: homeWins
                })
                .where(eq(matches.id, match_id));
            await db.update(teams).set({ wins: sql`${teams.wins} + 1` }).where(eq(teams.id, awayTeamId));
            await db.update(teams).set({ losses: sql`${teams.losses} + 1` }).where(eq(teams.id, homeTeamId));
        } else {
            throw new Error('Neither team has more wins, tie?');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating match result:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
