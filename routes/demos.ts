import express from 'express';
import { db, isAdmin } from '../db.ts';
import { users, matches, demos, demo_report, teams } from '../schema.ts';
import { eq, and, or } from 'drizzle-orm';
import path from 'path';

const router = express.Router();

router.get('/demos/:demoid', async (req, res) => {
    const demoId = Number(req.params.demoid);
    const currentUser = req.session?.user?.steamid;

    try {
        const admin = isAdmin(currentUser);

        const demo = await db.select().from(demos).where(eq(demos.id, demoId)).get();
        if (!demo) {
            res.status(404).send('Demo not found');
            return;
        }

        const player = await db.select().from(users).where(eq(users.steamId, demo.playerSteamId)).get();
        if (!player) {
            res.status(404).send('Player not found');
            return;
        }

        const submittedBy = await db.select().from(users).where(eq(users.steamId, demo.submittedBy)).get();
        console.log(1);
        const matchDetails = await db
        .select({
            matchId: matches.id,
            seasonNo: matches.seasonNo,
            weekNo: matches.weekNo,
            homeTeamId: matches.homeTeamId,
            awayTeamId: matches.awayTeamId,
        })
        .from(matches)
        .where(eq(matches.id, demo.matchId))
        .get();
        
        console.log(1);
        if (!matchDetails) {
            res.status(404).send('Match not found');
            return;
        }

        const awayTeamName = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, matchDetails.awayTeamId))
        .get();
    
        const homeTeamName = await db
        .select({ name: teams.name })
        .from(teams)
        .where(eq(teams.id, matchDetails.homeTeamId))
        .get();
    
        res.render('layout', {
            body: 'demos',
            title: 'Demo',
            demo,
            match: matchDetails,
            homeTeamName,
            awayTeamName,
            isAdmin: admin,
            player,
            submittedBy,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/demos/:demoid/submit_report', async (req, res) => {
    const demoId = Number(req.params.demoid);
    const steamId = req.session?.user?.steamid;

    if (!steamId) {
        res.status(401).send('Please sign in to submit a report');
        return;
    }

    const description = req.body.description?.trim();
    if (!description) {
        res.status(400).send('Invalid input');
        return;
    }

    try {
        const existingReport = await db.select().from(demo_report).where(
                and(
                    eq(demo_report.reportedBy, steamId),
                    eq(demo_report.demoId, demoId)
                )
            )
            .get();

        if (existingReport) {
            res.status(400).send('You have already submitted a report for this demo');
            return;
        }

        await db.insert(demo_report).values({
            demoId,
            reportedBy: steamId,
            reportedAt: new Date().toISOString(),
            status: 1,
            description
        });

        res.redirect(`/demos/${demoId}`);
    } catch (err) {
        console.error('Error posting report:', err.message);
        res.status(500).send('Internal Server Error');
    }
});


router.get('/demos/:demoid/download', async (req, res) => {
    const demoId = Number(req.params.demoid);
    const steamId = req.session?.user?.steamid;

    if (!steamId) {
        res.status(401).send('Unauthorized');
        return;
    }

    try {
        const demo = await db.select().from(demos).where(eq(demos.id, demoId)).get();
        if (!demo || !demo.file) {
            res.status(404).send('Demo file not found');
            return;
        }

        const filePath = path.resolve('./demos', demo.file);
        res.download(filePath, demo.file, (err) => {
            if (err) {
                console.error('Error sending file:', err.message);
                res.status(500).send('Internal Server Error');
            }
        });
    } catch (err) {
        console.error('Error retrieving demo:', err.message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;