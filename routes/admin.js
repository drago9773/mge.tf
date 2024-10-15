import express from 'express';
import { db, isAdmin } from '../db.js';
import { users, teams, matches, divisions, regions, seasons } from '../schema.js';
import { eq, sql } from 'drizzle-orm';

const router = express.Router();

router.get('/admin', async (req, res) => {
    const adminStatus = await isAdmin(req.session?.user?.steamid);
    if (!adminStatus) {
        res.status(404);
        return res.redirect('/');
    }
    let allUsers = await db.select().from(users).all();
    try {
        const allTeams = await db.select().from(teams);
        const allMatches = await db.select({
            ...matches,
            homeTeamName: teams.name,
            awayTeamName: sql`away.name`.as('away_team_name'),
            divisionName: divisions.name,
        })
            .from(matches)
            .innerJoin(teams, eq(matches.homeTeamId, teams.id))
            .innerJoin(sql`teams as away`, eq(matches.awayTeamId, sql`away.id`))
            .innerJoin(divisions, eq(matches.divisionId, divisions.id));

        const allDivisions = await db.select().from(divisions);
        const allRegions = await db.select().from(regions);

        res.render('layout', {
            body: 'admin',
            title: 'Admin',
            session: req.session,
            teams: allTeams,
            matches: allMatches,
            divisions: allDivisions,
            regions: allRegions,
            users: allUsers
        });
    } catch (err) {
        console.error('Error fetching data:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_team', async (req, res) => {
    const { name, division_id, season_no, region_id } = req.body;
    const record = '0-0';

    try {
        await db.insert(teams).values({
            name,
            record,
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

        // Redirect to the admin page after successful deletion
        res.redirect('/admin');
    } catch (err) {
        console.error('Error removing team:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_match', async (req, res) => {
    const { home_team_id, away_team_id, division_id, season_no, week_no } = req.body;

    try {
        await db.insert(matches).values({
            homeTeamId: Number(home_team_id),   // Ensure these are numbers
            awayTeamId: Number(away_team_id),
            divisionId: Number(division_id),
            seasonNo: Number(season_no),
            weekNo: Number(week_no),
            playedAt: null,  // Set playedAt to null
            winnerId: null,  // Set winnerId to null
            createdAt: Math.floor(Date.now() / 1000)  // Current timestamp
        });
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating match:', err);
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
    const { match_id, winner_id, loser_score } = req.body;

    try {
        await db.update(matches)
            .set({ winnerId: winner_id, loserScore: loser_score })
            .where(eq(matches.id, match_id));

        await db.update(teams)
            .set({
                record: sql`(CAST(SUBSTR(${teams.record}, 1, INSTR(${teams.record}, '-') - 1) AS INTEGER) + 1) || '-' || SUBSTR(${teams.record}, INSTR(${teams.record}, '-') + 1)`
            })
            .where(eq(teams.id, winner_id));

        if (parseInt(loser_score) > 0) {
            const loserTeam = await db.select()
                .from(matches)
                .where(eq(matches.id, match_id))
                .then(match => match[0].homeTeamId === winner_id ? match[0].awayTeamId : match[0].homeTeamId);

            await db.update(teams)
                .set({
                    record: sql`SUBSTR(${teams.record}, 1, INSTR(${teams.record}, '-') - 1) || '-' || (CAST(SUBSTR(${teams.record}, INSTR(${teams.record}, '-') + 1) AS INTEGER) + 1)`
                })
                .where(eq(teams.id, loserTeam));
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

router.post('/create_season', async (req, res) => {
    try {
        await db.insert('seasons').values({});
        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating season:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
