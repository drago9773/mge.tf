//global var for assigning team season id when they signup
const SEASON_ID = 1;

import express from 'express';
import { db } from '../db.js';
import { teams, players_in_teams, teamname_history, divisions, regions, seasons } from '../schema.js';
import { eq, and} from 'drizzle-orm';

const router = express.Router();

router.get('/1v1signup', async (req, res) => {
  res.status(200);
  return res.render('layout', { title: '1v1 Signups', body: '1v1signup', session: req.session })
});

router.get('/2v2signup', async (req, res) => {
  res.status(200);
  return res.render('layout', { title: '1v1 Signups', body: '2v2signup', session: req.session })
})


router.post('/team_signup', async (req, res) => {
  const { name, division_id, region_id, join_password, is_1v1, permission_level } = req.body;
  const player_steam_id = req.session.user.steamid;

  try {
      // check if they are in a 1v1/2v2 team and if active
      const existingTeam = await db
      .select()
      .from(players_in_teams)
      .innerJoin(teams, eq(players_in_teams.teamId, teams.id))
      .where(and(
          eq(players_in_teams.playerSteamId, player_steam_id), 
          eq(teams.is1v1, is_1v1),
          eq(players_in_teams.active, 1)
      ))
      .get();
  

      if (existingTeam) {
          if (is_1v1 == 1) {
              return res.status(400).send('Error: You are already in a 1v1 team.');
          } else {
              return res.status(400).send('Error: You are already in a 2v2 team.');
          }
      }

      const result = await db.insert(teams).values({
          name, 
          divisionId: division_id, 
          regionId: region_id, 
          seasonNo: SEASON_ID, 
          is1v1: is_1v1, 
          joinPassword: join_password
      });

      const team_id = result.lastInsertRowid;

      await db.insert(players_in_teams).values({
          playerSteamId: player_steam_id, 
          teamId: team_id, 
          permissionLevel: permission_level
      });
      await db.insert(teamname_history).values({
          name: name,
          teamId: team_id
      })

      res.redirect('/signup');
  } catch (err) {
      console.error('Error creating team or adding player:', err);
      res.status(500).send('Internal Server Error');
  }
});

router.get('/signup', async (req, res) => {
    const allTeams = await db.select().from(teams);
    const allDivisions = await db.select().from(divisions);
    const allSeasons = await db.select().from(seasons);
    const allRegions = await db.select().from(regions);
    

    res.render('layout', {
        body: 'signup',
        title: 'Signup',
        session: req.session,
        teams: allTeams,
        divisions: allDivisions,
        seasons: allSeasons,
        regions: allRegions,
    });
});

router.post('/signup', async (req, res) => {
    if (req.session?.user) {
        try {
            await db.update(users)
                .set({ isSignedUp: 1 })
                .where(eq(users.steamId, req.session.user.steamid));
            req.session.user.isSignedUp = 1;
            res.redirect('/signup');
        } catch (error) {
            console.error('Error updating user signup status:', error);
            res.status(500).send('An error occurred during signup');
        }
    } else {
        res.status(401).send('Unauthorized');
    }
});

export default router;
