import express from 'express';
import { db } from '../db.ts';
import { users, teams, global, pending_players, players_in_teams, teamname_history, denied_players } from '../schema.ts';
import { eq, and } from 'drizzle-orm';
import multer from 'multer';
import path from 'path';
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

router.get('/edit_team/:teamid', async (req, res) => {
    const teamid = Number(req.params.teamid);
    const allUsers = await db.select().from(users);
    const allGlobal = await db.select().from(global);  

    if (isNaN(teamid)) {
        return res.status(404).json({error: 'No such team'});
    }

    if (!req.session?.user) {
        return res.status(401).send('Please sign in'); 
    }

    const playerSteamId = req.session.user.steamid;

    try {
        const team = db.select().from(teams).where(eq(teams.id, teamid)).get();
        if (!team) {
            return res.status(404).send('Team not found');
        }
        const allPendingPlayers = await db.select({
            playerSteamId: pending_players.playerSteamId,
            teamId: pending_players.teamId,
            steamUsername: users.steamUsername,
            steamAvatar: users.steamAvatar
        })
        .from(pending_players)
        .innerJoin(users, eq(pending_players.playerSteamId, users.steamId))
        .innerJoin(teams, eq(pending_players.teamId, teams.id))
        .where(eq(pending_players.status, 0));

        const allPlayersInTeams = await db.select({
            playerSteamId: players_in_teams.playerSteamId,
            teamId: players_in_teams.teamId,
            active: players_in_teams.active,
            permissionLevel: players_in_teams.permissionLevel,
            startedAt: players_in_teams.startedAt,
            leftAt: players_in_teams.leftAt,
            steamUsername: users.steamUsername,
            steamAvatar: users.steamAvatar
        })
        .from(players_in_teams)
        .innerJoin(users, eq(players_in_teams.playerSteamId, users.steamId))
        .innerJoin(teams, eq(players_in_teams.teamId, teams.id));

        const playerInTeam = db
            .select().from(players_in_teams).where(
                and(
                    eq(players_in_teams.playerSteamId, playerSteamId),
                    eq(players_in_teams.teamId, teamid)
                )
            ).get();

        const deniedPlayers = await db.select({
            playerSteamId: denied_players.playerSteamId,
            teamId: denied_players.teamId,
            reason: denied_players.reason,
            adminId: denied_players.adminId,
            deniedAt: denied_players.deniedAt,
            steamUsername: users.steamUsername,
            steamAvatar: users.steamAvatar
        })
        .from(denied_players)
        .innerJoin(users, eq(denied_players.playerSteamId, users.steamId))
        .where(eq(denied_players.teamId, teamid));

        if (!playerInTeam || playerInTeam.permissionLevel < 1) {
            return res.status(403).send('You do not have permission to edit this team');
        }
        res.render('layout', {
            body: 'edit_team',
            title: 'Edit Team',
            announcements: [],
            team: team,
            users: allUsers,
            players_in_teams: allPlayersInTeams,
            pending_players: allPendingPlayers,
            denied_players: deniedPlayers,
            rosterLocked: allGlobal[0].rosterLocked,
            session: req.session
        });
    } catch (err) {
        console.error('Error querying database: ', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/edit_team/:teamid', async (req, res) => {
    const teamid = Number(req.params.teamid);
    if (isNaN(teamid)) {
        return res.status(403).send('Invalid team id');
    }

    try {
        const allGlobal = await db.select().from(global);
        if (allGlobal[0].rosterLocked) {
            return res.status(400).send(`Rosters are locked. Cannot make team changes.`);
        }
        const { team_name, acronym, join_password } = req.body;
        const teamData = db.select().from(teams).where(eq(teams.id, teamid)).get();

        if (teamData && teamData.name !== team_name) {
            await db.insert(teamname_history).values({
                name: team_name,
                teamId: teamid
            });
        }

        await db.update(teams)
            .set({
                name: team_name,
                acronym,
                joinPassword: join_password,
            })
            .where(eq(teams.id, teamid));

        res.redirect(`/team_page/${teamid}`);
    } catch (err) {
        console.error('Error querying database: ', err);
        res.status(500).send('Internal Server Error');
    }
});


router.post('/upload_team_avatar/:teamid', upload.single('avatar'), async (req, res) => {
    const teamid = Number(req.params.teamid);
    const timestamp = Date.now();
    if (isNaN(teamid)) {
        return res.status(403).send('Invalid team id');
    }
    try {
        const allGlobal = await db.select().from(global);
        if (allGlobal[0].rosterLocked) {
            return res.status(400).send(`Rosters are locked. Cannot make team changes.`);
        }

        if (req.file) {
            const ext = path.extname(req.file.originalname);
            const newFilename = `${teamid}_CreatedAt_${timestamp}${ext}`; 
            const oldPath = `./views/images/team_avatars/${req.file.filename}`;
            const newPath = `./views/images/team_avatars/${newFilename}`;
            
            fs.renameSync(oldPath, newPath);
            await db.update(teams).set({ avatar: newFilename }).where(eq(teams.id, teamid));
        }
        return res.redirect(`/edit_team/${teamid}`);
    } catch (err) {
        console.error('Error querying database: ', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/remove_player/:teamid', async (req, res) => {
    const teamId = Number(req.params.teamid);
    const playerSteamId = req.body.player_steamid;

    if (isNaN(teamId)) {
        return res.status(403).send('Invalid team id');
    }

    try {
        const allGlobal = await db.select().from(global);
        if (allGlobal[0].rosterLocked) {
            return res.status(400).send(`Rosters are CLOSED`);
        }
        if (!playerSteamId) {
            return res.status(400).send('Player Steam ID is required');
        }
        const currentDateTime = new Date().toISOString().slice(0, 19).replace('T', ' ');
        await db.update(players_in_teams)
            .set({
                active: 0,
                permissionLevel: -2,
                leftAt: currentDateTime
            })
            .where(
                and(
                    eq(players_in_teams.playerSteamId, playerSteamId),
                    eq(players_in_teams.teamId, teamId)
                )
            );

        return res.redirect(`/edit_team/${teamId}`);
    } catch (err) {
        console.error('Error querying database: ', err);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/approve_player/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        const playerSteamId = req.body.player_steamid;

        if (isNaN(teamId)) {
            return res.status(403).send('Invalid team id');
        }

        try {
            const allGlobal = await db.select().from(global);
            if (allGlobal[0].rosterLocked) {
                return res.status(400).send(`Rosters are CLOSED`);
            }

            const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            const activePlayers = await db
                .select()
                .from(players_in_teams)
                .where(and(
                    eq(players_in_teams.teamId, teamId),
                    eq(players_in_teams.active, 1)
                ));

            if (activePlayers.length >= 3) {
                return res.status(400).send('This team is full');
            }

            const playerIn2v2Team = await db
                .select()
                .from(players_in_teams)
                .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
                .where(and(
                    eq(players_in_teams.playerSteamId, playerSteamId),
                    eq(teams.is1v1, 0),
                    eq(players_in_teams.active, 1) 
                ))
                .get();
        
            if (playerIn2v2Team) {
                return res.status(400).send('Player already in a 2v2 team');
            }

            await db.update(pending_players).set({status: 1}).where(eq(pending_players.playerSteamId, playerSteamId))

            return res.redirect(`/edit_team/${teamId}`);
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

router.post('/decline_player/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        const playerSteamId = req.body.player_steamid;

        if (isNaN(teamId)) {
            return res.status(403).send('Invalid team id');
        }

        try {
            const allGlobal = await db.select().from(global);
            if (allGlobal[0].rosterLocked) {
                return res.status(400).send(`Rosters are CLOSED`);
            }

            const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            const pendingPlayer = db.select().from(pending_players)
                .where(and(eq(pending_players.playerSteamId, playerSteamId), eq(pending_players.teamId, teamId)))
                .get();

            if (!pendingPlayer) { 
                return res.status(404).send('Pending player record not found for this team'); 
            }

            await db.delete(pending_players)
                .where(and(eq(pending_players.playerSteamId, playerSteamId), eq(pending_players.teamId, teamId)));

            return res.redirect(`/edit_team/${teamId}`);
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

router.post('/promote_player/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        const playerSteamId = req.body.player_steamid;
        const currentUserSteamId = req.session.user.steamid;

        if (isNaN(teamId)) {
            return res.status(403).send('Invalid team id');
        }

        try {            
            const team = db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            const currentUserInTeam = db.select().from(players_in_teams)
                .where(and(eq(players_in_teams.playerSteamId, currentUserSteamId), eq(players_in_teams.teamId, teamId)))
                .get();
                
            const playerInTeam = db.select().from(players_in_teams)
                .where(and(eq(players_in_teams.playerSteamId, playerSteamId), eq(players_in_teams.teamId, teamId)))
                .get();
            
            if (!currentUserInTeam || !playerInTeam) {
                return res.status(404).send('Player or current user not found in team');
            }

            if (currentUserInTeam.permissionLevel < 1) {
                return res.status(403).send('You do not have permission to promote players');
            }

            const maxPromoteLevel = currentUserInTeam.permissionLevel === 2 ? 2 : 1;

            if (playerInTeam.permissionLevel >= maxPromoteLevel) {
                return res.status(403).send('You cannot promote this player any further.');
            }

            if(currentUserInTeam.permissionLevel == playerInTeam.permissionLevel) {
                return res.status(403).send('You cannot promote this player.');
            }

            await db.update(players_in_teams)
                .set({ permissionLevel: playerInTeam.permissionLevel + 1 })
                .where(and(eq(players_in_teams.playerSteamId, playerSteamId), eq(players_in_teams.teamId, teamId)));

            return res.redirect(`/edit_team/${teamId}`);
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

router.post('/demote_player/:teamid', async (req, res) => {
    if (req.session?.user) {
        const teamId = Number(req.params.teamid);
        const playerSteamId = req.body.player_steamid;
        const currentUserSteamId = req.session.user.steamid;

        if (isNaN(teamId)) {
            return res.status(403).send('Invalid team id');
        }

        try {
            const team = await db.select().from(teams).where(eq(teams.id, teamId)).get();
            if (!team) {
                return res.status(404).send('Team not found');
            }

            const currentUserInTeam = await db.select().from(players_in_teams)
                .where(and(eq(players_in_teams.playerSteamId, currentUserSteamId), eq(players_in_teams.teamId, teamId)))
                .get();
                
            const playerInTeam = await db.select().from(players_in_teams)
                .where(and(eq(players_in_teams.playerSteamId, playerSteamId), eq(players_in_teams.teamId, teamId)))
                .get();

            if (!currentUserInTeam || !playerInTeam) {
                return res.status(404).send('Player or current user not found in team');
            }

            if (currentUserInTeam.permissionLevel < 1 || (currentUserInTeam.permissionLevel === 1 && playerInTeam.permissionLevel > 1)) {
                return res.status(403).send('You do not have permission to demote this player');
            }

            if (playerInTeam.permissionLevel <= 0) {
                return res.status(403).send('You cannot demote this player any further.');
            }

            if(currentUserInTeam.permissionLevel == playerInTeam.permissionLevel) {
                return res.status(403).send('You cannot demote this player.');
            }

            await db.update(players_in_teams)
                .set({ permissionLevel: playerInTeam.permissionLevel - 1 })
                .where(and(eq(players_in_teams.playerSteamId, playerSteamId), eq(players_in_teams.teamId, teamId)));

            return res.redirect(`/edit_team/${teamId}`);
        } catch (err) {
            console.error('Error querying database: ' + (err as Error).message);
            return res.status(500).send('Internal Server Error');
        }
    } else {
        return res.status(401).send('Please sign in');
    }
});

export default router;