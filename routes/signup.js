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
    const ownedTeams = req.session?.user?.steamid ? 
            await db.select()
                .from(teams)
                .innerJoin(players_in_teams, 
                    and(
                        eq(players_in_teams.teamId, teams.id),
                        eq(players_in_teams.playerSteamId, req.session.user.steamid),
                        eq(players_in_teams.permissionLevel, 2)
                    )
                )
                .where(eq(teams.is1v1, 0))
                .all() 
            : [];

    const naRegion = allRegions.find(r => r.name === 'NA');
    const euRegion = allRegions.find(r => r.name === 'EU');

    res.render('layout', {
        body: 'signup',
        title: 'Signup',
        announcements: [],
        session: req.session,
        teams: allTeams,
        divisions: allDivisions,
        seasons: allSeasons,
        regions: allRegions,
        ownedTeams,
        naRegionId: naRegion?.id,
        euRegionId: euRegion?.id,
        signupClosed: allGlobal[0].signupClosed,
        signupSeasonId: allGlobal[0].naSignupSeasonId || allGlobal[0].euSignupSeasonId,
    });
});



router.post('/team_signup', upload.single('avatar'), async (req, res) => {
    const { name, acronym, division_id, region_id, join_password, is_1v1, permission_level } = req.body;
    const player_steam_id = req.session?.user?.steamid;

    try {
        const allGlobal = await db.select().from(global);
        if (allGlobal[0].signupClosed) {
            return res.status(400).send(`Signups are CLOSED`);
        }

        let seasonId;
        if (region_id === '1') {
            seasonId = allGlobal[0].naSignupSeasonId;
        } else if (region_id === '2') {
            seasonId = allGlobal[0].euSignupSeasonId;
        } else {
            return res.status(400).send(`No active season found for region: ${region_id}`);
        }
        
        if (!seasonId) {
            return res.status(400).send(`No active season found for ${region_id.name} region`);
        }

        // check if they are in a 1v1/2v2 team and if active
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

        let avatarFilename = null;
        if (req.file) {
            const timestamp = Date.now();
            const ext = path.extname(req.file.originalname);
            avatarFilename = `${name}_CreatedAt_${timestamp}${ext}`;
            const oldPath = `./views/images/team_avatars/${req.file.filename}`;
            const newPath = `./views/images/team_avatars/${avatarFilename}`;

            fs.renameSync(oldPath, newPath);
        }

        const result = await db.insert(teams).values({
            name,
            acronym,
            avatar: avatarFilename,
            divisionId: division_id,
            regionId: region_id,
            seasonId: seasonId,
            is1v1: is_1v1,
            joinPassword: join_password
        });
        const team_id = Number(result.lastInsertRowid);

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

router.post('/existing_team_signup', async (req, res) => {
    const { team_id, region_id, division_id, ToS } = req.body;
    const userSteamId = req.session?.user?.steamid;

    if (!userSteamId || !team_id || !region_id || !division_id || !ToS) {
        return res.status(400).send('Missing required fields');
    }

    try {
        const teamMember = await db.select()
            .from(players_in_teams)
            .where(and(
                eq(players_in_teams.teamId, team_id),
                eq(players_in_teams.playerSteamId, userSteamId),
                eq(players_in_teams.permissionLevel, 2)
            ))
            .get();

        if (!teamMember) {
            return res.status(403).send('Not authorized to sign up this team');
        }

        // Get the appropriate signup season based on selected region
        const allGlobal = await db.select().from(global);
        const signupSeasonId = region_id === '2' ? // '2' for EU, '1' for NA
            allGlobal[0].euSignupSeasonId :
            allGlobal[0].naSignupSeasonId;

        if (!signupSeasonId) {
            return res.status(400).send('No active season found for selected region');
        }

        // Update team's season and other details
        await db.update(teams)
            .set({ 
                seasonId: signupSeasonId,
                regionId: parseInt(region_id),
                divisionId: parseInt(division_id),
                status: 0, // UNREADY
                paymentStatus: 0,
                wins: 0,
                losses: 0,
                gamesWon: 0,
                gamesLost: 0,
                pointsScored: 0,
                pointsScoredAgainst: 0
            })
            .where(eq(teams.id, team_id));

        res.redirect('/team_page/' + team_id);
    } catch (error) {
        console.error('Error signing up team for new season:', error);
        res.status(500).send('Internal Server Error');
    }
});

export default router;
