import express from 'express';
import { db } from '../db.ts';
import { divisions, regions, seasons, arenas, global, pending_players, announcements } from '../schema.ts';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => {
        cb(null, './views/images/arena_avatars');
    },
    filename: (_req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.random().toString(36).substring(2, 9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 }
});

router.post('/create_announcement', async (req, res) => {
    const { name } = req.body;
    if (!name || name.trim() === '') {
      return res.status(400).send('Announcement content cannot be empty.');
    }
  
    try {
      await db.insert(announcements).values({ content: name.trim(), visible: 0 });
      res.redirect('/admin');
    } catch (error) {
      console.error('Error creating announcement:', error);
      res.status(500).send('Internal Server Error');
    }
  });

router.post('/toggle_announcement_visibility', async (req, res) => {
    const { id } = req.body;

    if (!id) {
        return res.status(400).send('Announcement ID is required.');
    }

    try {
        const announcement = await db.select().from(announcements).where(eq(announcements.id, id)).get();

        if (!announcement) {
        return res.status(404).send('Announcement not found.');
        }

        const newVisibility = announcement.visible === 0 ? 1 : 0;

        await db
            .update(announcements)
            .set({ visible: newVisibility })
            .where(eq(announcements.id, id));

        res.redirect('/admin');
    } catch (error) {
        console.error('Error toggling announcement visibility:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/edit_announcement', async (req, res) => {
    const { id, content } = req.body;
  
    if (!id || !content || content.trim() === '') {
      return res.status(400).send('Announcement ID and new content are required.');
    }
  
    try {
      await db
        .update(announcements)
        .set({ content: content.trim() })
        .where(eq(announcements.id, id));
  
      res.redirect('/admin');
    } catch (error) {
      console.error('Error editing announcement:', error);
      res.status(500).send('Internal Server Error');
    }
  });
  

router.post('/update_status', async (req, res) => {
    const { action, value } = req.body;
    const numericValue = parseInt(value); 

    try {
        const allPendingPlayers = await db.select().from(pending_players);
        if (action === 'roster') { 
            await db.update(global).set({ rosterLocked: numericValue });
            const allGlobal = await db.select().from(global);  
            if (allGlobal[0].rosterLocked == 1) {
                await db.delete(pending_players);
                console.log("Dropping all pending players...");
            }
        } else if (action === 'signup') { await db.update(global).set({ signupClosed: numericValue });
        } else { throw new Error('Invalid action'); }

        res.redirect('/admin');
    } catch (error) {
        console.error('Error updating status:', error);
        res.status(500).send('Server Error');
    }
});


router.post('/update_num_weeks', async (req, res) => {
    const { numWeeks, seasonId } = req.body;
    await db.update(seasons).set({numWeeks}).where(eq(seasons.id, seasonId));
    res.redirect('/admin');
});

router.post('/admin_update_division_name', async (req, res) => {
    const { divisionId, name } = req.body; 
    await db.update(divisions).set({ name }).where(eq(divisions.id, divisionId));
    res.redirect('/admin');
});

router.post('/admin_update_division_cost', async (req, res) => {
    const { divisionId, signupCost } = req.body; 
    await db.update(divisions).set({ signupCost }).where(eq(divisions.id, divisionId));
    res.redirect('/admin');
});

router.post('/admin_update_region_name', async (req, res) => {
    const { regionId, name } = req.body; 
    try {
        await db.update(regions).set({ name }) .where(eq(regions.id, regionId));
        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating region:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin_update_arena_name', async (req, res) => {
    const { arenaId, name } = req.body; 
    try {
        await db.update(arenas)
            .set({ name }) 
            .where(eq(arenas.id, arenaId));

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating arena:', err);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/admin_update_arena_avatar/:arenaid', upload.single('avatar'), async (req, res, ) => {
    const { arena_id, name } = req.body; 
    try {
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const newFilename = `${name}_avatar${ext}`; 
            const oldPath = `./views/images/arena_avatars/${req.file.filename}`;
            const newPath = `./views/images/arena_avatars/${newFilename}`;

            fs.renameSync(oldPath, newPath);

            await db.update(arenas).set({ avatar: newFilename }).where(eq(arenas.id, arena_id));
        }
        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating arena:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_season', async (req, res) => {
    const { numWeeks } = req.body;
    try {
        await db.insert(seasons).values({ numWeeks });
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

router.post('/create_arena', upload.single('avatar'), async (req, res) => {
    const { name } = req.body;
    try {
        const result = await db.insert(arenas).values({ name });
        const arena_id = Number(result.lastInsertRowid);
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const newFilename = `${name}_avatar${ext}`; 
            const oldPath = `./views/images/arena_avatars/${req.file.filename}`;
            const newPath = `./views/images/arena_avatars/${newFilename}`;

            fs.renameSync(oldPath, newPath);

            await db.update(arenas).set({ avatar: newFilename }).where(eq(arenas.id, arena_id));
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error creating arena:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/remove_season', async (req, res) => {
    const seasonId = req.body.season_id;
    try{
        await db.delete(seasons).where(eq(seasons.id, seasonId));
    } catch (error) {
        console.log('Unable to remove season: ', error);
    }
    res.redirect('/admin');

});
router.post('/remove_division', async (req, res) => {
    const divisionId = req.body.division_id;
    try{
        await db.delete(divisions).where(eq(divisions.id, divisionId));
    } catch (error) {
        console.log('Unable to remove division: ', error);
    }
    res.redirect('/admin');
});
router.post('/remove_region', async (req, res) => {
    const regionId = req.body.region_id;
    try{
        await db.delete(regions).where(eq(regions.id, regionId));
    } catch (error) {
        console.log('Unable to remove region: ', error);
    }
    res.redirect('/admin');
});
router.post('/remove_arena', async (req, res) => {
    const arenaId = req.body.arena_id;
    try{
        await db.delete(arenas).where(eq(arenas.id, arenaId));
    } catch (error) {
        console.log('Unable to remove arena: ', error);
    }
    res.redirect('/admin');
});

export default router;