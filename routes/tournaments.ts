import express from 'express';
import { db } from '../db.ts';
import { tournaments, moderators, users } from '../schema.ts';
import { sql, eq } from 'drizzle-orm';

// Add proper typing for tournament
type Tournament = {
    id: number;
    name: string;
    startedAt: string | null;
    description: string | null;
    avatar: string | null;
    bracketLink: string | null;
    winner1SteamId: string | null;
    winner2SteamId: string | null;
    isTeamTournament: boolean;
};

const router = express.Router();

router.get('/tournaments', async (req, res) => {
    try {
        const allTournaments = await db.select().from(tournaments) as Tournament[];
        
        const tournamentsWithWinners = await Promise.all(allTournaments.map(async tournament => {
            let winner1User = null;
            let winner2User = null;
            
            if (tournament.winner1SteamId) {
                winner1User = await db.select()
                    .from(users)
                    .where(eq(users.steamId, tournament.winner1SteamId))
                    .then(users => users[0]);
            }
            
            if (tournament.winner2SteamId) {
                winner2User = await db.select()
                    .from(users)
                    .where(eq(users.steamId, tournament.winner2SteamId))
                    .then(users => users[0]);
            }
            
            return {
                ...tournament,
                winner1User,
                winner2User
            };
        }));

        const moderatorIds = await db.select().from(moderators);

        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        const userIsMod = moderatorSet.has(req.session.user?.steamid || '');

        res.render('layout', {
            title: 'Tournaments',
            body: 'tournaments',
            announcements: [],
            user: req.session.user,
            userIsMod: userIsMod,
            tournaments: tournamentsWithWinners,
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

        const { name, description, bracketLink, avatar, startedAt, isTeamTournament } = req.body;
        
        const timestamp = new Date(startedAt).toISOString();

        await db.insert(tournaments).values({
            name,
            description,
            bracketLink: bracketLink,
            avatar,
            startedAt: timestamp,
            isTeamTournament: isTeamTournament === 'on' // Convert checkbox value to boolean
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

router.post('/tournaments/:id/winners', async (req, res) => {
    try {
        const moderatorIds = await db.select().from(moderators);
        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        if (!req.session.user || !moderatorSet.has(req.session.user.steamid)) {
            return res.status(403).send('Unauthorized');
        }

        const { winner1SteamId, winner2SteamId } = req.body;
        const tournamentId = parseInt(req.params.id);

        await db.update(tournaments)
            .set({
                winner1SteamId: winner1SteamId,
                winner2SteamId: winner2SteamId || null
            })
            .where(eq(tournaments.id, tournamentId));

        res.redirect('/tournaments');
    } catch (err) {
        console.error('Error setting winners:', err);
        res.status(500).send('Internal Server Error');
    }
});

export default router;