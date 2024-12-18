import express from 'express';
import {db} from '../db.ts';
import {eq, or, like} from 'drizzle-orm';
import {users, moderators, UserRole, BanStatus, punishment} from '../schema.ts';

const router = express.Router();
const supermods = ['76561199032212844', '76561198082657536'];

router.get('/', async (req, res) => {
    const steamID = req?.session?.user?.steamid;
    const {addMod, removeMod} = req.query;
    res.status(200);
    if (!steamID) {
        return res.json({error: "F's in chat, you gotta be logged in"});
    }
    if (typeof addMod !== 'string') {
        return res.json({error: "addMod must be a string"});
    }
    if (typeof removeMod !== 'string') {
        return res.json({error: "removeMod must be a string"});
    }

    try {
        const moderatorRows = await db.select().from(moderators);
        const moderatorIDs = moderatorRows.map(mod => mod.steamId);
        const isCurrentUserMod = moderatorIDs.includes(steamID) || supermods.includes(steamID);

        if (isCurrentUserMod) {
            if (addMod) {
                await db.insert(moderators).values({steamId: addMod}).onConflictDoNothing();
                return res.json({success: `Added new moderator: ${addMod}`});
            } else if (removeMod) {
                if (removeMod === steamID) {
                    return res.json({error: "You can't remove yourself as a moderator"});
                }
                await db.delete(moderators).where(eq(moderators.steamId, removeMod));
                return res.json({success: `Removed moderator: ${removeMod}`});
            } else {
                return res.json({message: 'No action specified. Use addMod or removeMod query parameters.'});
            }
        } else {
            return res.json({error: 'You do not have permission to modify moderators'});
        }
    } catch (err) {
        console.error('Error in moderator operation:', err);
        return res.json({error: 'Oops. Something went wrong'});
    }
});

router.get('/usersearch', async (req, res) => {
    const steamID = req?.session?.user?.steamid;
    const {q} = req.query;

    if (!steamID) {
        return res.json({error: 'You must be logged in to search users'});
    }

    try {
        const currentUser = await db.select().from(users).where(eq(users.steamId, steamID)).limit(1);

        if (!currentUser.length || currentUser[0].permissionLevel < UserRole.MODERATOR) {
            return res.json({error: 'You do not have permission to search users'});
        }

        const searchResults = await db
            .select()
            .from(users)
            .where(q ? or(like(users.steamId, `%${q}%`), like(users.steamUsername, `%${q}%`)) : undefined)
            .limit(20);

        const formattedResults = searchResults.map(user => ({
            steamId: user.steamId,
            steamUsername: user.steamUsername,
            permissionLevel: user.permissionLevel === UserRole.ADMIN ? 'Admin' : user.permissionLevel === UserRole.MODERATOR ? 'Moderator' : user.permissionLevel === UserRole.USER ? 'User' : 'Guest',
            banStatus: user.banStatus === BanStatus.NONE ? 'None' : user.banStatus === BanStatus.SUSPENDED ? 'Suspended' : user.banStatus === BanStatus.BANNED ? 'Ban' : "Null",
        }));

        return res.json(formattedResults);

    } catch (err) {
        console.error('Error in user search:', err);
        return res.json({error: 'An error occurred while searching users'});
    }
});

router.post('/unban', async (req, res) => {
    const adminSteamID = req.session?.user?.steamid;
    const targetSteamID = req.body.steamId;

    if (!adminSteamID || !targetSteamID) {
        return res.status(400).json({error: 'Missing admin or target Steam ID.'});
    }

    try {
        const adminUser = db.select().from(users).where(eq(users.steamId, adminSteamID)).get();
        if (!adminUser || adminUser.permissionLevel < UserRole.ADMIN) {
            return res.status(403).json({error: 'Unauthorized. Admin access required.'});
        }

        const result = db.update(users)
            .set({isBanned: 0})
            .where(eq(users.steamId, targetSteamID))
            .run();

        if (result.changes === 0) {
            return res.status(404).json({error: 'User not found or already unbanned.'});
        }

        res.status(200).json({message: 'User unbanned successfully.'});
    } catch (error) {
        console.error('Error unbanning user:', error);
        res.status(500).json({error: 'An error occurred while unbanning the user.'});
    }
});

export default router;