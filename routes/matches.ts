import express from 'express';
import { db, isAdmin } from '../db.ts';
import { teams, regions, divisions, seasons, matches, arenas, games, players_in_teams, pending_players, teamname_history } from '../schema.ts';
import { eq, and, or, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/match_page/:matchid', async (req, res) => {
    const matchid = Number(req.params.matchid);
    const adminStatus = isAdmin(req.session?.user?.steamid);
    try {
        const match = db.select().from(matches).where(eq(matches.id, matchid)).get();
        
        if (!match) {
            res.status(404).send('Match not found');
            return;
        }
        const owners = await db.select().from(players_in_teams).where(
            and(
                eq(players_in_teams.permissionLevel, 2),
                or(
                    eq(players_in_teams.teamId, match.homeTeamId), 
                    eq(players_in_teams.teamId, match.awayTeamId)
                )
            )
        );
        let playerSteamId = null;
        if (req.session && req.session.user) {
            playerSteamId = req.session.user.steamid;
        }
        const isTeamOwner = owners.some(owner => owner.playerSteamId === playerSteamId) ? 1 : 0;
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
            isAdmin: adminStatus,
            isTeamOwner,
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

router.post('/match_page/:matchid/update-scores', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const match = await db.select().from(matches).where(eq(matches.id, matchId));
    const gameScores = req.body;

    if (typeof gameScores !== 'object' || Array.isArray(gameScores)) {
        return res.status(400).send('Invalid request format');
    }
    if (req.body.isTeamOwner == null) {
        return res.status(400).send('Not team owner');
    }

    try {
        const parsedScores = [];

        for (const key in gameScores) {
            const [scoreType, gameIndex] = key.split('-');
            const scoreValue = Number(gameScores[key]);

            if (isNaN(scoreValue)) {
                return res.status(400).send('Invalid score value');
            }

            if (!parsedScores[gameIndex]) {
                parsedScores[gameIndex] = { gameId: Number(gameIndex) };
            }

            if (scoreType === 'homeTeamScore') {
                parsedScores[gameIndex].homeTeamScore = scoreValue;
            } else if (scoreType === 'awayTeamScore') {
                parsedScores[gameIndex].awayTeamScore = scoreValue;
            }
        }

        let homeWins = 0;
        let awayWins = 0;

        for (const game of parsedScores) {
            const { gameId, homeTeamScore, awayTeamScore } = game;
            if (homeTeamScore !== undefined && awayTeamScore !== undefined) {
                if (homeTeamScore > awayTeamScore) {
                    homeWins++;
                } else if (awayTeamScore > homeTeamScore) {
                    awayWins++;
                }

                await db.update(games)
                    .set({
                        matchId,
                        homeTeamScore,
                        awayTeamScore,
                    })
                    .where(
                        and(
                            eq(games.matchId, matchId),
                            eq(games.gameNum, gameId + 1)
                        )
                    );
            }
        }

        const adminUpdate = match.length > 0 && match[0].winnerId !== null;
        console.log("admin update: ", adminUpdate);

        let winnerId = null;
        let winnerScore = null;
        let loserScore = null;

        if (homeWins > awayWins) {
            winnerId = match[0].homeTeamId;
            winnerScore = homeWins;
            loserScore = awayWins;
        } else if (awayWins > homeWins) {
            winnerId = match[0].awayTeamId;
            winnerScore = awayWins;
            loserScore = homeWins;
        }

        console.log("winner id: ", winnerId);

        if (adminUpdate) {
            const previousWinnerId = Number(match[0].winnerId);

            if (previousWinnerId !== winnerId) {
                await db.update(teams)
                    .set({
                        wins: sql`${teams.wins} - 1`,
                        losses: sql`${teams.losses} - 1`,
                    })
                    .where(eq(teams.id, previousWinnerId));

                await db.update(teams)
                    .set({
                        wins: sql`${teams.wins} - 1`,
                        losses: sql`${teams.losses} - 1`,
                    })
                    .where(eq(teams.id, match[0].homeTeamId === previousWinnerId ? match[0].awayTeamId : match[0].homeTeamId));
            }
        }

        if (winnerId !== null) {
            await db.update(teams)
                .set({
                    wins: sql`${teams.wins} + 1`,
                })
                .where(eq(teams.id, winnerId));

            await db.update(teams)
                .set({
                    losses: sql`${teams.losses} + 1`,
                })
                .where(eq(teams.id, match[0].homeTeamId === winnerId ? match[0].awayTeamId : match[0].homeTeamId));
        }

        await db.update(matches)
            .set({
                winnerId,
                winnerScore,
                loserScore,
            })
            .where(eq(matches.id, matchId));

        res.status(200).send("Game scores and match winner updated successfully");
    } catch (err) {
        console.error("Error updating game scores:", err);
        res.status(500).send("Internal Server Error");
    }
});

export default router;