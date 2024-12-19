//global var for assigning team season id when they signup
const SEASON_ID = 1;

import express from 'express';
import { db } from '../db.ts';
import { teams, players_in_teams, teamname_history, divisions, regions, seasons, global } from '../schema.ts';
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

router.get('/1v1signup', async (req, res) => {
  return res.render('layout', { title: '1v1 Signups', body: '1v1signup', announcements: [], session: req.session })
});

router.get('/2v2signup', async (req, res) => {
  return res.render('layout', { title: 'Signups', body: '2v2signup', announcements: [], session: req.session })
})

router.get('/signup', async (req, res) => {
    const allTeams = await db.select().from(teams);
    const allDivisions = await db.select().from(divisions);
    const allSeasons = await db.select().from(seasons);
    const allRegions = await db.select().from(regions);
    const allGlobal = await db.select().from(global);    

    res.render('layout', {
        body: 'signup',
        title: 'Signup',
        announcements: [],
        session: req.session,
        teams: allTeams,
        divisions: allDivisions,
        seasons: allSeasons,
        regions: allRegions,
        signupClosed: allGlobal[0].signupClosed,
    });
});



router.post('/team_signup', upload.single('avatar'), async (req, res) => {
    const { name, acronym, division_id, region_id, join_password, is_1v1, permission_level } = req.body;
    const player_steam_id = req.session?.user?.steamid;
    const allGlobal = await db.select().from(global);
    const signupClosed = allGlobal[0].signupClosed;
    
    try {
        // check if they are in a 1v1/2v2 team and if active
        if(signupClosed){
            return res.status(400).send(`Signups are CLOSED`);
        }
        const existingTeam = db
            .select()
            .from(players_in_teams)
            .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
            .where(and(
                eq(players_in_teams.playerSteamId, String(player_steam_id)),
                eq(teams.is1v1, is_1v1),
                eq(players_in_teams.active, 1)
            ))
            .get();
        if (existingTeam) {
            return res.status(400).send(`Error: You are already in a ${is_1v1 ? '1v1' : '2v2'} team.`);
        }
        const result = await db.insert(teams).values({
            name,
            acronym,
            avatar: req.file ? req.file.filename : null,
            divisionId: division_id,
            regionId: region_id,
            seasonNo: SEASON_ID,
            is1v1: is_1v1,
            joinPassword: join_password
        });
        
        const team_id = Number(result.lastInsertRowid);
        const timestamp = Date.now();
        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const newFilename = `team${name}_avatarCreatedAt${timestamp}${ext}`;
            const oldPath = `./views/images/team_avatars/${req.file.filename}`;
            const newPath = `./views/images/team_avatars/${newFilename}`;

            fs.renameSync(oldPath, newPath);

            await db.update(teams).set({ avatar: newFilename }).where(eq(teams.id, team_id));
        }

        await db.insert(players_in_teams).values({
            playerSteamId: player_steam_id,
            teamId: team_id,
            permissionLevel: permission_level
        });

        await db.insert(teamname_history).values({
            name,
            teamId: team_id
        });

        return res.redirect(`/team_page/${team_id}`);
    } catch (err) {
        console.error('Error creating team or adding player:', err);
        res.status(500).send('Internal Server Error');
    }
});


export default router;
