import express from 'express';
import { db, isAdmin } from '../db.ts';
import { pending_players, players_in_teams, denied_players } from '../schema.ts';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.post('/approve_player', async (req, res) => {
  const { player_steamid, team_id } = req.body;
  console.log("req body: ", req.body);
  const adminStatus = isAdmin(req.session?.user?.steamid);
  if (!adminStatus) {
      return res.status(403).redirect('/');
  }
  try {
    await db.insert(players_in_teams).values({
      playerSteamId: player_steamid,
      teamId: team_id,
      active: 1,
      permissionLevel: 0, 
    });

    await db.delete(pending_players).where(eq(pending_players.playerSteamId, player_steamid));

    res.redirect('/admin');
  } catch (error) {
    console.error('Error approving player:', error);
    res.status(500).send('Server Error');
  }
});

router.post('/decline_player', async (req, res) => {
  const { player_steamid, team_id, reason } = req.body;

  const adminId = req.session.user?.steamid;
  const adminStatus = isAdmin(req.session?.user?.steamid);
  if (!adminStatus) {
    return res.status(403).redirect('/');
  }

  try {
    await db.insert(denied_players).values({
      playerSteamId: player_steamid,
      teamId: team_id,
      reason: reason,
      adminId: adminId,
    });

    await db.delete(pending_players).where(eq(pending_players.playerSteamId, player_steamid));

    res.redirect('/admin');
  } catch (error) {
    console.error('Error declining player:', error);
    res.status(500).send('Server Error');
  }
});

export default router;
