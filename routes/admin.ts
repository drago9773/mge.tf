import express from 'express';
import { db, isAdmin } from '../db.ts';
import { arenas, punishment, divisions, matches, players_in_teams, regions, seasons, teams, users, demos, demo_report, global, pending_players } from '../schema.ts';
import { and, eq } from 'drizzle-orm';

const router = express.Router();

async function create_match_set(region_id: number, division_id: number) {
    try {
        const allTeamsInMatches = db
            .select()
            .from(teams)
            .where(
                and(
                    eq(teams.regionId, region_id),
                    eq(teams.divisionId, division_id),
                    eq(teams.status, 2)
                )
            )
            .all();
        return allTeamsInMatches.sort((a, b) => {
            const winLossRatioA = a.losses === 0 ? a.wins : a.wins / (a.wins + a.losses);
            const winLossRatioB = b.losses === 0 ? b.wins : b.wins / (b.wins + b.losses);

            if (winLossRatioA !== winLossRatioB) {
                return winLossRatioB - winLossRatioA;
            }

            const pointsRatioA = a.pointsScored / (a.pointsScoredAgainst || 1);
            const pointsRatioB = b.pointsScored / (b.pointsScoredAgainst || 1);

            return pointsRatioB - pointsRatioA;
        });
    } catch (error) {
        console.error('Error seeding teams:', error);
        throw error;
    }
}

router.get('/admin', async (req, res) => {
    const adminStatus = isAdmin(req.session?.user?.steamid);
    if (!adminStatus) {
        return res.status(403).redirect('/');
    }

    try {
        const allTeams = await db.select().from(teams);
        const allArenas = await db.select().from(arenas);
        const allDivisions = await db.select().from(divisions);
        const allRegions = await db.select().from(regions);
        const allSeasons = await db.select().from(seasons);
        const allUsers = await db.select().from(users);
        const disputedMatches = await db.select().from(matches).where(eq(matches.status, 2));
        const allPlayersInTeams = await db.select({
                playerInTeamSteamId: players_in_teams.playerSteamId,
                playerAvatar: users.steamAvatar,
                playerName: users.steamUsername,
                playerSteamId: users.steamId,
                teamId: players_in_teams.teamId,
                startedAt: players_in_teams.startedAt,
                permissionLevel: players_in_teams.permissionLevel
            })
            .from(players_in_teams)
            .innerJoin(users, eq(players_in_teams.playerSteamId, users.steamId))
            .innerJoin(teams, eq(players_in_teams.teamId, teams.id));
        const pendingPlayers = await db
            .select({
                playerSteamId: pending_players.playerSteamId,
                playerName: users.steamUsername,
                playerSteamAvatar: users.steamAvatar,
                teamId: pending_players.teamId,
                teamName: teams.name,
                status: pending_players.status
            })
            .from(pending_players)
            .innerJoin(users, eq(pending_players.playerSteamId, users.steamId))
            .innerJoin(teams, eq(pending_players.teamId, teams.id))
            .where(eq(pending_players.status, 1)); 
        const playersByTeam = allTeams.map(team => ({
            ...team,
            players: allPlayersInTeams.filter(player => player.teamId === team.id)
        }));        
        const allDemos = await db.select().from(demos);
        const allGlobal = await db.select().from(global);
        const allDemoReports = await db
            .select()
            .from(demo_report)
            .leftJoin(users, eq(demo_report.reportedBy, users.steamId));

        const allPunishments = await db.select().from(punishment)
        .leftJoin(users, eq(punishment.playerSteamId, users.steamId));
        
        res.render('layout', {
            body: 'admin',
            title: 'Admin',
            session: req.session,
            teams: allTeams,
            arenas: allArenas,
            divisions: allDivisions,
            seasons: allSeasons,
            regions: allRegions,
            disputedMatches,
            players_in_teams: allPlayersInTeams,
            teamsWithPlayers: playersByTeam,
            global: allGlobal[0],
            users: allUsers,
            demos: allDemos,
            pendingPlayers: pendingPlayers,
            demoReports: allDemoReports,
            punishments: allPunishments
        });
    } catch (err) {
        console.error('Error fetching data in /admin:', (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/admin/update_team_status', async (req, res) => {
    if (!isAdmin(req.session?.user?.steamid)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { teamId, status } = req.body;

    try {
        await db.update(teams).set({ status }).where(eq(teams.id, teamId));

        return res.json({ success: true, message: 'Team status updated', teamId, status });
    } catch (error) {
        console.error('Error updating team status:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/admin/update_division', async (req, res) => {
    if (!isAdmin(req.session?.user?.steamid)) {
        return res.status(403).json({ success: false, message: 'Forbidden' });
    }

    const { teamId, divisionId } = req.body;

    try {
        await db.update(teams).set({ divisionId: divisionId }).where(eq(teams.id, teamId));

        return res.json({ success: true, message: 'Team division updated', teamId, divisionId });
    } catch (error) {
        console.error('Error updating team division:', error);
        return res.status(500).json({ success: false, message: 'Internal server error' });
    }
});

router.post('/admin/preview_match', async (req, res) => {
    if (!isAdmin(req.session?.user?.steamid)) {
        return res.status(403).redirect('/');
    }
    const { region_id, division_id, season_no, week_no, bo_series, arena_id, match_date_time } = req.body;
    console.log(`Region ID: ${region_id}, Division ID: ${division_id}, Season: ${season_no}, Week: ${week_no}, BO Series: ${bo_series},  arena id: ${arena_id}, Time/Date: ${match_date_time}`);

    try {
        const sortedTeams = await create_match_set(region_id, division_id);

        res.render('layout', {
            body: 'preview_match',
            title: 'Preview',
            session: req.session,
            teams: sortedTeams,
            regionId: region_id,
            boSeries: bo_series,
            weekNo: week_no,
            seasonNo: season_no,
            arenaId: arena_id,
            matchDateTime: match_date_time
        });
    } catch (error) {
        console.error('Error fetching teams:', error);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/punish', async (req, res) => {
    const adminSteamID = req.session?.user?.steamid;
    const { targetSteamID, duration, severity, reason }  = req.body;
    console.log(req.body);

    try {
        let startTime = Math.floor(Date.now() / 1000);
        let durationTime = duration;
        
        await db.insert(punishment).values({
                playerSteamId: targetSteamID,
                punishedBy: adminSteamID,
                duration: durationTime,
                startDateTime: startTime,
                status: 1,
                severity,
                reason
            })

        await db.update(users).set({
            banStatus: severity
        }).where(eq(users.steamId, targetSteamID));

        res.status(200).json({message: 'User punished successfully.'});
    } catch (error) {
        console.error('Error banning user:', error);
        res.status(500).json({error: 'An error occurred while banning the user.'});
    }
});

export default router;
