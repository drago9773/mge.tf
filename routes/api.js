import express from 'express';
import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { moderators } from '../schema.js';

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

export default router;