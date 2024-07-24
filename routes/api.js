import express from 'express';
import { db } from '../db.js';
import { eq, or, like } from 'drizzle-orm';
import { users, moderators, UserRole } from '../schema.js';

const router = express.Router();
const supermods = ['76561199032212844'];

router.get('/', async (req, res) => {
  const steamID = req?.session?.user?.steamid;
  const { addMod, removeMod } = req.query;

  if (!steamID) {
    return res.json({ error: "F's in chat, you gotta be logged in" });
  }

  try {
    const moderatorRows = await db.select().from(moderators);
    const moderatorIDs = moderatorRows.map(mod => mod.steamId);
    const isCurrentUserMod = moderatorIDs.includes(steamID) || supermods.includes(steamID);

    if (isCurrentUserMod) {
      if (addMod) {
        await db.insert(moderators).values({ steamId: addMod }).onConflictDoNothing();
        return res.json({ success: `Added new moderator: ${addMod}` });
      } else if (removeMod) {
        if (removeMod === steamID) {
          return res.json({ error: "You can't remove yourself as a moderator" });
        }
        await db.delete(moderators).where(eq(moderators.steamId, removeMod));
        return res.json({ success: `Removed moderator: ${removeMod}` });
      } else {
        return res.json({ message: 'No action specified. Use addMod or removeMod query parameters.' });
      }
    } else {
      return res.json({ error: 'You do not have permission to modify moderators' });
    }
  } catch (err) {
    console.error('Error in moderator operation:', err);
    return res.json({ error: 'Oops. Something went wrong' });
  }
});

router.get('/usersearch', async (req, res) => {
  const steamID = req?.session?.user?.steamid;
  const { q } = req.query;

  if (!steamID) {
    return res.json({ error: 'You must be logged in to search users' });
  }

  try {
    const currentUser = await db.select().from(users).where(eq(users.steamId, steamID)).limit(1);

    if (!currentUser.length || currentUser[0].permissionLevel < UserRole.MODERATOR) {
      return res.json({ error: 'You do not have permission to search users' });
    }

    let query = db.select().from(users);

    if (q) {
      query = query.where(
        or(
          like(users.steamId, `%${q}%`),
          like(users.steamUsername, `%${q}%`)
        )
      );
    }

    query = query.limit(20);  // Limit the results to 20 users

    const searchResults = await query;


    const formattedResults = searchResults.map(user => ({
      steamId: user.steamId,
      steamUsername: user.steamUsername,
      permissionLevel: user.permissionLevel === UserRole.ADMIN ? 'Admin' :
        user.permissionLevel === UserRole.MODERATOR ? 'Moderator' :
          user.permissionLevel === UserRole.USER ? 'User' : 'Guest',
      isSignedUp: Boolean(user.isSignedUp),
      isBanned: Boolean(user.isBanned)
    }));

    return res.json(formattedResults);

  } catch (err) {
    console.error('Error in user search:', err);
    return res.json({ error: 'An error occurred while searching users' });
  }
});

export default router;