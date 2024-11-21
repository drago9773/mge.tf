import express from 'express';
import { db, isAdmin } from '../db.ts';
import { teams, regions, divisions, seasons, matches, arenas, games, players_in_teams, match_comms } from '../schema.ts';
import { eq, and, or, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/match_page/:matchid', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const steamId = req.session?.user?.steamid || null;
    const admin = steamId ? isAdmin(steamId) : false;

    try {
        const match = db.select().from(matches).where(eq(matches.id, matchId)).get();

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

        const homeTeamOwners = owners
            .filter(owner => owner.teamId === match.homeTeamId)
            .map(owner => owner.playerSteamId);

        const awayTeamOwners = owners
            .filter(owner => owner.teamId === match.awayTeamId)
            .map(owner => owner.playerSteamId);

        let isHomeTeamOwner = false;
        let isAwayTeamOwner = false;
        let hasPendingReschedule = null;
        const matchComms = await db.select().from(match_comms).where(eq(match_comms.matchId, matchId));

        if (steamId) {
            isHomeTeamOwner = homeTeamOwners.includes(steamId);
            isAwayTeamOwner = awayTeamOwners.includes(steamId);

            hasPendingReschedule = matchComms.some(comm =>
                comm.rescheduleStatus === 0 && (
                    (isHomeTeamOwner && awayTeamOwners.includes(comm.owner)) ||
                    (isAwayTeamOwner && homeTeamOwners.includes(comm.owner)) 
                )
            );
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
            isAdmin: admin,
            isTeamOwner: isHomeTeamOwner || isAwayTeamOwner,
            hasPendingReschedule,
            teams: allTeams,
            arenas: allArenas,
            divisions: allDivisions,
            seasons: allSeasons,
            regions: allRegions,
            games: allGames,
            matchComms,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/match_page/:matchid/update-scores', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const steamId = req.session?.user?.steamid;
    const gameScores = req.body;
    const admin = isAdmin(req.session?.user?.steamid);
    console.log(req.body);

    try {
        const match = await db.select().from(matches).where(eq(matches.id, matchId));
        const homeTeam = await db.select().from(teams).where(eq(teams.id, match[0].homeTeamId));
        const awayTeam = await db.select().from(teams).where(eq(teams.id, match[0].awayTeamId));
        const previousScores = await db.select({homeScoreSum: sql`SUM(${games.homeTeamScore})`, awayScoreSum: sql`SUM(${games.awayTeamScore})`,
            }).from(games).where(eq(games.matchId, matchId)
        );

        if (!admin && match[0].status == 1){
            return res.status(403).send('Match has already been played.');
        }
        const previousHomeScores = previousScores[0].homeScoreSum || 0;
        const previousAwayScores = previousScores[0].awayScoreSum || 0;


        if (typeof gameScores !== 'object' || Array.isArray(gameScores)) {
            return res.status(400).send('Invalid request format');
        }
        
        if (!match) {
            res.status(404).send('Match not found');
            return;
        }
        const owners = await db.select().from(players_in_teams).where(
            and(
                eq(players_in_teams.permissionLevel, 2),
                or(
                    eq(players_in_teams.teamId, match[0].homeTeamId), 
                    eq(players_in_teams.teamId, match[0].awayTeamId)
                )
            )
        );
        const isTeamOwner = owners.some(owner => owner.playerSteamId === steamId) ? 1 : 0;
        if (!isTeamOwner && !admin) {
            return res.status(403).send('Unauthorized');
        }

        const parsedScores = [];

        for (const key in gameScores) {
            console.log("key: ", key);
            const [scoreType, gameIndex] = key.split('-');
            const scoreValue = Number(gameScores[key]);
            console.log("score val: ", scoreValue);
            console.log("score type: ", scoreType);
            console.log("game index: ", gameIndex);
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
        let homePointsScored = 0;
        let awayPointsScored = 0;
        
        for (const game of parsedScores) {
            const { gameId, homeTeamScore, awayTeamScore } = game;
            if (homeTeamScore !== undefined && awayTeamScore !== undefined) {
                if (homeTeamScore > awayTeamScore) {
                    homeWins++;
                } else if (awayTeamScore > homeTeamScore) {
                    awayWins++;
                }

                homePointsScored += homeTeamScore;
                awayPointsScored += awayTeamScore;

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
        let winnerId = null;
        let winnerScore = null;
        let loserScore = null;
        let previousWinnerScore = null;
        let previousLoserScore = null;
        if (previousHomeScores > previousAwayScores) {
            previousWinnerScore = previousHomeScores;
            previousLoserScore = previousAwayScores;
        } else {
            previousWinnerScore = previousAwayScores;
            previousLoserScore = previousHomeScores;
        }

        //admin update logic to revert changes
        if (adminUpdate) {
            const previousWinnerId = Number(match[0].winnerId);
            if (previousWinnerId !== winnerId) {
                //revert previous teams stats
                await db.update(teams)
                    .set({
                        wins: sql`${teams.wins} - 1`,
                        pointsScored: sql`${teams.pointsScored} - ${previousWinnerScore}`,
                        pointsScoredAgainst: sql`${teams.pointsScoredAgainst} - ${previousLoserScore}`,
                    })
                    .where(eq(teams.id, previousWinnerId));

                await db.update(teams)
                    .set({
                        losses: sql`${teams.losses} - 1`,
                        pointsScored: sql`${teams.pointsScored} - ${previousLoserScore}`,
                        pointsScoredAgainst: sql`${teams.pointsScoredAgainst} - ${previousWinnerScore}`,
                    })
                    .where(eq(teams.id, match[0].homeTeamId === previousWinnerId ? match[0].awayTeamId : match[0].homeTeamId));
            }
        }

        let winnerPointsScored = null;
        let loserPointsScored = null;
        if (homeWins > awayWins) {
            winnerId = match[0].homeTeamId;
            winnerScore = homeWins;
            loserScore = awayWins;
            winnerPointsScored = homePointsScored;
            loserPointsScored = awayPointsScored;
        } else if (awayWins > homeWins) {
            winnerId = match[0].awayTeamId;
            winnerScore = awayWins;
            loserScore = homeWins;
            winnerPointsScored = awayPointsScored;
            loserPointsScored = homePointsScored;
        }

        await db.update(teams)
            .set({
                pointsScored: sql`${teams.pointsScored} + ${homePointsScored}`,
                pointsScoredAgainst: sql`${teams.pointsScoredAgainst} + ${awayPointsScored}`,
                gamesWon: sql`${teams.gamesWon} + ${homeWins}`,
                gamesLost: sql`${teams.gamesLost} + ${awayWins}`,
            })
            .where(eq(teams.id, match[0].homeTeamId));

        await db.update(teams)
            .set({
                pointsScored: sql`${teams.pointsScored} + ${awayPointsScored}`,
                pointsScoredAgainst: sql`${teams.pointsScoredAgainst} + ${homePointsScored}`,
                gamesWon: sql`${teams.gamesWon} + ${awayWins}`,
                gamesLost: sql`${teams.gamesLost} + ${homeWins}`,
            })
            .where(eq(teams.id, match[0].awayTeamId));

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
                status: 1
            })
            .where(eq(matches.id, matchId));

            // remove any outstanding reschedule requests
            const pendingRescheduleRequest = db.select().from(match_comms).where(
                and(
                    eq(match_comms.matchId, matchId),
                    eq(match_comms.rescheduleStatus, 0)
                )
            ).get();
            
            if (pendingRescheduleRequest) {
                await db.update(match_comms)
                    .set({
                        rescheduleStatus: 3
                    })
                    .where(eq(match_comms.id, pendingRescheduleRequest.id));
            
                await db.insert(match_comms)
                    .values({
                        content: 'Scores submitted. Reschedule request canceled.',
                        matchId: matchId,
                        owner: '76561198082657536'
                    });
            }
            res.redirect(`/match_page/${matchId}`);
        } catch (err) {
        console.error("Error updating game scores:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/match_page/:matchid/dispute', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const steamId = req.session?.user?.steamid;
    const admin = isAdmin(req.session?.user?.steamid);

    try {
        const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
        if (!match) { return res.status(404).send('Match not found'); }
        if (match.status !== 1) { 
            return res.status(404).send('Match has not been played yet or has already been disputed'); 
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
        const isTeamOwner = owners.some(owner => owner.playerSteamId === steamId) ? 1 : 0;

        if (!isTeamOwner && !admin) {
            return res.status(403).send('Unauthorized');
        }

        await db.update(matches)
        .set({
            status: 2
        })
        .where(eq(matches.id, matchId));
        res.redirect(`/match_page/${matchId}`);

    } catch (err) {
        console.error("Error updating game scores:", err);
        res.status(500).send("Internal Server Error");
    }
});

router.post('/match_page/:matchid/post-message', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const { content } = req.body;
    const steamId = req.session?.user?.steamid;
    const admin = isAdmin(req.session?.user?.steamid);


    try {
        const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
        if (!match) { return res.status(404).send('Match not found'); }

        const owners = await db.select().from(players_in_teams).where(
            and(
                eq(players_in_teams.permissionLevel, 2),
                or(
                    eq(players_in_teams.teamId, match.homeTeamId), 
                    eq(players_in_teams.teamId, match.awayTeamId)
                )
            )
        );
        const isTeamOwner = owners.some(owner => owner.playerSteamId === steamId) ? 1 : 0;

        if (!isTeamOwner && !admin) {
            return res.status(403).send('Unauthorized');
        }

        await db.insert(match_comms).values({
            content,
            owner: steamId,
            matchId,
            reschedule: null,
            rescheduleStatus: null,
            createdAt: new Date().toISOString()
        });

        res.redirect(`/match_page/${matchId}`);
    } catch (err) {
        console.error('Error posting message:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/match_page/:matchid/reschedule', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const { proposedDate } = req.body;
    const steamId = req.session?.user?.steamid;
    const admin = isAdmin(req.session?.user?.steamid);

    try {
        const match = db.select().from(matches).where(eq(matches.id, matchId)).get();
        if (!match) { return res.status(404).send('Match not found'); }
        if (!admin && match.status !== 0) { 
            return res.status(403).send('Match has already been played'); 
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
        const isTeamOwner = owners.some(owner => owner.playerSteamId === steamId) ? 1 : 0;

        if (!isTeamOwner && !admin) {
            return res.status(403).send('Unauthorized');
        }

        await db.insert(match_comms).values({
            content: `RESCHEDULE REQUESTED: ${proposedDate}`,
            owner: steamId,
            matchId,
            reschedule: proposedDate,
            rescheduleStatus: 0,
            createdAt: new Date().toISOString()
        });

        res.redirect(`/match_page/${matchId}`);
    } catch (err) {
        console.error('Error submitting reschedule:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/match_page/:matchid/respond-reschedule', async (req, res) => {
    const matchId = Number(req.params.matchid);
    const { rescheduleId, response } = req.body;
    console.log("req body: ", req.body);
    const steamId = req.session?.user?.steamid;
    const admin = isAdmin(req.session?.user?.steamid);

    try {
        const match = await db.select().from(matches).where(eq(matches.id, matchId)).get();
        if (!match) { return res.status(404).send('Match not found'); }

        const owners = await db.select().from(players_in_teams).where(
            and(
                eq(players_in_teams.permissionLevel, 2),
                or(
                    eq(players_in_teams.teamId, match.homeTeamId),
                    eq(players_in_teams.teamId, match.awayTeamId)
                )
            )
        );
        const isTeamOwner = owners.some(owner => owner.playerSteamId === steamId) ? 1 : 0;

        if (!isTeamOwner && !admin) {
            return res.status(403).send('Unauthorized');
        }

        const rescheduleRequest = await db.select().from(match_comms).where(eq(match_comms.id, rescheduleId)).get();

        if (!rescheduleRequest || rescheduleRequest.matchId !== matchId || rescheduleRequest.rescheduleStatus !== 0) {
            return res.status(400).send('Invalid reschedule request');
        }

        let rescheduleStatusMessage = '';
        if (response === 'accept') {
            await db.update(matches).set({ matchDateTime: rescheduleRequest.reschedule }).where(eq(matches.id, matchId));
            await db.update(match_comms).set({ rescheduleStatus: 1 }).where(eq(match_comms.id, rescheduleId));
            rescheduleStatusMessage = 'MATCH RESPONSE: Reschedule request accepted.';
        } else if (response === 'deny') {
            await db.update(match_comms).set({ rescheduleStatus: 2 }).where(eq(match_comms.id, rescheduleId));
            rescheduleStatusMessage = 'MATCH RESPONSE: Reschedule request denied.';
        } else if (response === 'cancel') {
            await db.update(match_comms).set({ rescheduleStatus: 3 }).where(eq(match_comms.id, rescheduleId));
            rescheduleStatusMessage = 'MATCH RESPONSE: Reschedule request canceled.';
        } else {
            return res.status(400).send('Invalid response action');
        }

        await db.insert(match_comms).values({
            matchId: matchId,
            content: rescheduleStatusMessage,
            owner: steamId,
            createdAt: new Date().toISOString()
        });

        res.redirect(`/match_page/${matchId}`);
    } catch (err) {
        console.error('Error responding to reschedule:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;