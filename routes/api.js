import express from 'express';
import db from '../db.js';

const router = express.Router();

const supermods = ['76561199032212844']

router.get('/', (req, res) => {
  const steamID = req?.session?.user?.steamid;
  const { addMod, removeMod } = req.query;

  if (!steamID) {
    return res.json({ error: "F's in chat, you gotta be logged in" });
  }

  db.all('SELECT steam_id from moderators', (err, moderators) => {
    if (err) {
      console.error('Trouble getting moderator IDs from database:', err);
      return res.json({ error: 'Oops. Something went wrong' });
    }

    const moderatorIDs = moderators.map(mod => mod.steam_id);
    const isCurrentUserMod = moderatorIDs.includes(steamID) || supermods.includes(steamID);

    if (isCurrentUserMod) {
      if (addMod) {
        db.run('INSERT OR IGNORE INTO moderators (steam_id) VALUES (?)', [addMod], (err) => {
          if (err) {
            console.error('Error adding new moderator:', err);
            return res.json({ error: 'Failed to add new moderator' });
          }
          return res.json({ success: `Added new moderator: ${addMod}` });
        });
      } else if (removeMod) {
        if (removeMod === steamID) {
          return res.json({ error: "You can't remove yourself as a moderator" });
        }
        db.run('DELETE FROM moderators WHERE steam_id = ?', [removeMod], (err) => {
          if (err) {
            console.error('Error removing moderator:', err);
            return res.json({ error: 'Failed to remove moderator' });
          }
          return res.json({ success: `Removed moderator: ${removeMod}` });
        });
      } else {
        return res.json({ message: 'No action specified. Use addMod or removeMod query parameters.' });
      }
    } else {
      return res.json({ error: 'You do not have permission to modify moderators' });
    }
  });
});

export default router;