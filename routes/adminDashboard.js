import express from 'express';
import { db } from '../db.js';
import { divisions, regions, seasons, arenas } from '../schema.js';
import { eq, sql, and } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const router = express.Router();

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, './views/images/arena_avatars');
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

router.post('/admin_update_num_weeks', async (req, res) => {
    const { numWeeks, seasonId } = req.body; 
    try {
        const result = await db.update(seasons)
            .set({ numWeeks }) 
            .where(eq(seasons.id, seasonId));

        if (result.changes === 0) {
            return res.status(404).send('Season not found or weeks unchanged.');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating season:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin_update_division_name', async (req, res) => {
    const { divisionId, name } = req.body; 
    try {
        const result = await db.update(divisions)
            .set({ name }) 
            .where(eq(divisions.id, divisionId));

        if (result.changes === 0) {
            return res.status(404).send('Division not found or name unchanged.');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating division:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin_update_region_name', async (req, res) => {
    const { regionId, name } = req.body; 
    try {
        const result = await db.update(regions)
            .set({ name }) 
            .where(eq(regions.id, regionId));

        if (result.changes === 0) {
            return res.status(404).send('Region not found or name unchanged.');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating region:', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin_update_arena_name', async (req, res) => {
    const { arenaId, name } = req.body; 
    try {
        const result = await db.update(arenas)
            .set({ name }) 
            .where(eq(arenas.id, arenaId));

        if (result.changes === 0) {
            return res.status(404).send('Arena not found or name unchanged.');
        }

        res.redirect('/admin');
    } catch (err) {
        console.error('Error updating arena:', err);
        res.status(500).send('Internal Server Error');
    }
});
router.post('/admin_update_arena_avatar/:arenaid', upload.single('avatar'), async (req, res) => {
    const { arena_id, name } = req.body; 
    console.log(req.body);
    console.log(arena_id);
    console.log(name);
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
    console.log(req.body);
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
        const arena_id = result.lastInsertRowid;
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
        console.log("Unable to remove arena: ", error);
    }
    res.redirect('/admin');
});

export default router;