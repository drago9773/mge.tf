import express from 'express';
import { db } from '../db.ts';
import { fight_night, fight_night_matchups, moderators, users } from '../schema.ts';
import { sql } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import { eq, and} from 'drizzle-orm';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './views/images/team_avatars');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substr(2, 9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

const fightNightStorage = multer.diskStorage({
  destination: './views/fightnights/',
  filename: (_req, file, cb) => {
    cb(null, 'fn-' + Date.now() + path.extname(file.originalname));
  }
});

const fightNightUpload = multer({ storage: fightNightStorage });

router.get('/create_fightnight', (req, res) => {
  if (!req.session.user?.permissionLevel || req.session.user.permissionLevel < 2) {
    return res.redirect('/');
  }
  res.render('layout', { 
    title: 'Create Fight Night', 
    body: 'create_fightnight',
    session: req.session,
    announcements: []
  });
});

router.post('/create_fightnight', fightNightUpload.single('card'), async (req, res) => {
  if (!req.session.user?.permissionLevel || req.session.user.permissionLevel < 2) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    const { description } = req.body;
    const cardPath = req.file ? `/fightnights/${req.file.filename}` : null;

    await db.insert(fight_night).values({
      description,
      card: cardPath
    });

    res.redirect('/fightnights');
  } catch (error) {
    console.error('Error creating fight night:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.get('/fightnights', async (req, res) => {
  try {
    const fightNights = await db.select().from(fight_night).orderBy(fight_night.id);
    res.render('layout', {
      title: 'Fight Nights',
      body: 'fightnights',
      fightNights,
      session: req.session,
      announcements: []
    });
  } catch (error) {
    console.error('Error fetching fight nights:', error);
    res.status(500).send('Internal server error');
  }
});

router.get('/fightnight/:id', async (req, res) => {
  try {
    const [fightNight, allUsers, matchups] = await Promise.all([
      db.select()
        .from(fight_night)
        .where(eq(fight_night.id, parseInt(req.params.id)))
        .then(rows => rows[0]),
      db.select().from(users),
      db.select()
        .from(fight_night_matchups)
        .where(eq(fight_night_matchups.fightNightId, parseInt(req.params.id)))
        .orderBy(fight_night_matchups.orderNum)
    ]);

    if (!fightNight) {
      return res.status(404).send('Fight night not found');
    }

    res.render('layout', {
      title: 'Fight Night',
      body: 'fightnight',
      fightNight,
      allUsers,
      matchups,
      session: req.session,
      announcements: []
    });
  } catch (error) {
    console.error('Error fetching fight night:', error);
    res.status(500).send('Internal server error');
  }
});

router.post('/fightnight/:id/prizepool', async (req, res) => {
  if (!req.session.user?.permissionLevel || req.session.user.permissionLevel < 2) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.update(fight_night)
      .set({ prizepool: req.body.amount })
      .where(eq(fight_night.id, parseInt(req.params.id)));
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update prize pool' });
  }
});

router.post('/fightnight/:id/matchup', async (req, res) => {
  if (!req.session.user?.permissionLevel || req.session.user.permissionLevel < 2) {
    return res.status(403).json({ error: 'Unauthorized' });
  }

  try {
    await db.insert(fight_night_matchups).values({
      fightNightId: parseInt(req.params.id),
      player1SteamId: req.body.player1,
      player2SteamId: req.body.player2,
      orderNum: req.body.orderNum
    });
    
    res.redirect(`/fightnight/${req.params.id}`);
  } catch (error) {
    res.status(500).send('Failed to add matchup');
  }
});

router.post('/fightnight/:id', async (req, res) => {
    try {
        const moderatorIds = await db.select().from(moderators);
        const moderatorSet = new Set(moderatorIds.map(m => m.steamId));

        if (!req.session.user || !moderatorSet.has(req.session.user.steamid)) {
            return res.status(403).send('Unauthorized');
        }

        if (req.body._method === 'DELETE') {
            await db.delete(fight_night)
                .where(sql`${fight_night.id} = ${parseInt(req.params.id)}`);
        }

        res.redirect('/fightnights');
    } catch (err) {
        console.error('Error deleting fight night: ' + (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

export default router;