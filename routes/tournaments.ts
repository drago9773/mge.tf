import express from 'express';
import { db } from '../db.ts';
import { tournaments, moderators } from '../schema.ts';
import { sql } from 'drizzle-orm';

const router = express.Router();

router.get('/tournaments', async (req, res) => {
    try {
        const allTournaments = await db.select().from(tournaments);
        const moderatorIds = await db.select().from(moderators);

        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        const userIsMod = moderatorSet.has(req.session.user?.steamid || '');

        res.render('layout', {
            title: 'Tournaments',
            body: 'tournaments',
            user: req.session.user,
            userIsMod: userIsMod,
            tournaments: allTournaments,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/tournaments', async (req, res) => {
    try {
        const moderatorIds = await db.select().from(moderators);
        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        if (!req.session.user || !moderatorSet.has(req.session.user.steamid)) {
            return res.status(403).send('Unauthorized');
        }

        const { name, description, bracket_link, avatar, startedAt } = req.body;

        const timestamp = new Date(startedAt).toISOString();

        await db.insert(tournaments).values({
            name,
            description,
            bracket_link,
            avatar,
            startedAt: timestamp
        });

        res.redirect('/tournaments');
    } catch (err) {
        console.error('Error creating tournament: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/tournaments/:id', async (req, res) => {
    try {
        const moderatorIds = await db.select().from(moderators);
        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        if (!req.session.user || !moderatorSet.has(req.session.user.steamid)) {
            return res.status(403).send('Unauthorized');
        }

        if (req.body._method === 'DELETE') {
            await db.delete(tournaments)
                .where(sql`${tournaments.id} = ${parseInt(req.params.id)}`);
        }

        res.redirect('/tournaments');
    } catch (err) {
        console.error('Error deleting tournament: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;