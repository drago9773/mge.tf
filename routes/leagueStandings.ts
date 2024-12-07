import express from 'express';
import { db } from '../db.ts';
import { teams, divisions } from '../schema.ts';
import { and, eq } from 'drizzle-orm';

const router = express.Router();

async function seed_teams_by_division(region_id: number, division_id: number) {
    try {
        const allTeamsInMatches = db
            .select()
            .from(teams)
            .where(
                and(
                    eq(teams.regionId, region_id),
                    eq(teams.divisionId, division_id),
                    eq(teams.status, 2)
                )
            )
            .all();

        return allTeamsInMatches.sort((a, b) => {
            const winLossRatioA = a.losses === 0 ? a.wins : a.wins / (a.wins + a.losses);
            const winLossRatioB = b.losses === 0 ? b.wins : b.wins / (b.wins + b.losses);

            if (winLossRatioA !== winLossRatioB) {
                return winLossRatioB - winLossRatioA;
            }

            const pointsRatioA = a.pointsScored / (a.pointsScoredAgainst || 1);
            const pointsRatioB = b.pointsScored / (b.pointsScoredAgainst || 1);

            return pointsRatioB - pointsRatioA;
        });
    } catch (error) {
        console.error('Error seeding teams:', error);
        throw error;
    }
}

router.get('/team_standings', async (req, res) => {
    try {
        const allDivisions = await db.select().from(divisions);
        const standingsByDivision = {};

        for (const division of allDivisions) {
            const teamsInDivision = await seed_teams_by_division(1, division.id);
            standingsByDivision[division.name] = teamsInDivision; 
        }

        res.render('layout', {
            title: 'Team Standings by Division',
            body: 'team_standings',
            standingsByDivision,
            session: req.session,
        });
    } catch (err) {
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;