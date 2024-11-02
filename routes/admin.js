import express from 'express';
import { db, isAdmin } from '../db.js';
import { users, teams, matches, divisions, regions, seasons, arenas, games, players_in_teams } from '../schema.js';
import { eq, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/admin', async (req, res) => {
    const adminStatus = await isAdmin(req.session?.user?.steamid);
    if (!adminStatus) {
        return res.status(403).redirect('/');
    }

    try {
        const allTeams = await db.select().from(teams);

        const allMatches = await db
            .select({
                ...matches,
                homeTeamName: teams.name,
                awayTeamName: sql`away.name`.as('away_team_name'),
                divisionName: divisions.name,
            })
            .from(matches)
            .innerJoin(teams, eq(matches.homeTeamId, teams.id))
            .innerJoin(sql`teams as away`, eq(matches.awayTeamId, sql`away.id`))
            .innerJoin(divisions, eq(matches.divisionId, divisions.id));

        const allArenas = await db.select().from(arenas);
        const allDivisions = await db.select().from(divisions);
        const allRegions = await db.select().from(regions);
        const allSeasons = await db.select().from(seasons);
        const allUsers = await db.select().from(users);
        
        const allPlayersInTeams = await db
            .select({
                playerSteamId: players_in_teams.playerSteamId,
                playerAvatar: users.steamAvatar,
                playerName: users.steamUsername,
                playerSteamId: users.steamId,
                teamId: players_in_teams.teamId,
                startedAt: players_in_teams.startedAt,
                permissionLevel: players_in_teams.permissionLevel
            })
            .from(players_in_teams)
            .innerJoin(users, eq(players_in_teams.playerSteamId, users.steamId))
            .innerJoin(teams, eq(players_in_teams.teamId, teams.id));
        
            const playersByTeam = allTeams.map(team => ({
                ...team,
                players: allPlayersInTeams.filter(player => player.teamId === team.id)
            }));

        res.render('layout', {
            body: 'admin',
            title: 'Admin',
            session: req.session,
            teams: allTeams,
            matches: allMatches,
            arenas: allArenas,
            divisions: allDivisions,
            seasons: allSeasons,
            regions: allRegions,
            players_in_teams: allPlayersInTeams,
            teamsWithPlayers: playersByTeam,
            users: allUsers,
        });
    } catch (err) {
        console.error('Error fetching data in /admin:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_team', async (req, res) => {
    const { name, division_id, season_no, region_id } = req.body;

    try {
        await db.insert(teams).values({
            name,
            divisionId: division_id,
            regionId: region_id,
            seasonNo: season_no
        });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating team:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/remove_team', async (req, res) => {
    const { team_id } = req.body;

    try {
        const result = await db.delete(teams).where(eq(teams.id, team_id));

        if (result.changes === 0) {
            return res.status(404).send('Team not found.');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error removing team:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_arena', async (req, res) => {
    const { name } = req.body;
    try {
        await db.insert(arenas).values({ name });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating arena:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_match', async (req, res) => {
    const { home_team_id, away_team_id, division_id, season_no, week_no } = req.body;

    try {
        await db.insert(matches).values({
            homeTeamId: (home_team_id),
            awayTeamId: (away_team_id),
            divisionId: (division_id),
            seasonNo: (season_no),
            weekNo: (week_no),
            playedAt: null, 
            winnerId: null,
            createdAt: Math.floor(Date.now() / 1000)
        });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating match:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_season', async (req, res) => {
    const { num_weeks } = req.body;
    try {
        await db.insert(seasons).values({ num_weeks });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating season:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_division', async (req, res) => {
    const { name } = req.body;
    try {
        await db.insert(divisions).values({ name });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating division:', err);
        res.status(500).send('Internal Server Error');
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

router.post('/create_region', async (req, res) => {
    const { name } = req.body;
    try {
        await db.insert(regions).values({ name });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating region:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.get('/get-weeks/:seasonId', async (req, res) => {
    const seasonId = req.params.seasonId;
    
    try {
        const result = await db.select({ num_weeks: seasons.numWeeks }).from(seasons).where(eq(seasons.id, seasonId)).limit(1);
        
        if (result.length > 0) {
            res.json({ num_weeks: result[0].num_weeks });
        } else {
            res.status(404).json({ error: 'Season not found' });
        }
    } catch (err) {
        console.error('Error fetching weeks:', err);
        res.status(500).json({ error: 'Database error' });
    }
});

router.get('/get-arenas', async (req, res) => {
    try {
      const allArenas = await db.select().from(arenas);
      res.json(allArenas);
    } catch (error) {
      console.error('Error fetching arenas:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  
  router.post('/remove_season', async (req, res) => {
    const seasonId = req.body.season_id;
    try{
        await db.delete(seasons).where(eq(seasons.id, seasonId));
    } catch (error) {
        console.log("Unable to remove season: ", error);
    }
    res.redirect('/admin');

  });
  
  router.post('/remove_division', async (req, res) => {
    const divisionId = req.body.division_id;
    try{
        await db.delete(divisions).where(eq(divisions.id, divisionId));
    } catch (error) {
        console.log("Unable to remove division: ", error);
    }
    res.redirect('/admin');
  });
  
  router.post('/remove_region', async (req, res) => {
    const regionId = req.body.region_id;
    try{
        await db.delete(regions).where(eq(regions.id, regionId));
    } catch (error) {
        console.log("Unable to remove region: ", error);
    }
    res.redirect('/admin');
  });

  router.post('/remove_arena', async (req, res) => {
    const arenaId = req.body.arena_id;
    try{
        await db.delete(arenas).where(eq(arenas.id, arenaId));
    } catch (error) {
        console.log("Unable to remove region: ", error);
    }
    res.redirect('/admin');
  });

  router.post('/admin_update_status', async (req, res) => {
    const { teamId, status } = req.body; 
    try {
        const result = await db.update(teams)
            .set({ status: status }) 
            .where(eq(teams.id, teamId));

        if (result.changes === 0) {
            return res.status(404).send('Team not found or status unchanged.');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating team status:', err);
        res.status(500).send('Internal Server Error');
    }
});


export default router;
