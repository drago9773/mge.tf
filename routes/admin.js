import express from 'express';
import db, { isAdmin } from '../db.js';

const router = express.Router();

router.get('/admin', async (req, res) => {
    console.log(req.session?.user);
    const adminStatus = await isAdmin(req.session?.user?.steamid);
    console.log(`Admin status:dd ${adminStatus}`);
    if (!adminStatus) {
        res.status(404);
        return res.redirect('/');
    }
    db.all('SELECT * FROM teams', [], (err, teams) => {
        if (err) {
            console.error('Error getting teams: ' + err.message);
            teams = [];
        }
        db.all(`SELECT matches.*, home.name AS home_team_name, away.name AS away_team_name, divisions.name AS division_name
                FROM matches 
                JOIN teams AS home ON matches.home_team_id = home.id 
                JOIN teams AS away ON matches.away_team_id = away.id
                JOIN divisions ON matches.division_id = divisions.id`, [], (err, matches) => {
            if (err) {
                console.error('Error getting matches: ' + err.message);
                matches = [];
            }
            db.all('SELECT * FROM divisions', [], (err, divisions) => {
                if (err) {
                    console.error('Error getting divisions: ' + err.message);
                    divisions = [];
                }
                db.all('SELECT * FROM regions', [], (err, regions) => {
                    if (err) {
                        console.error('Error getting regions: ' + err.message);
                        regions = [];
                    }
                    res.render('layout', {body: 'admin', title: 'Admin', session: req.session, teams, matches, divisions, regions });
                });
            });
        });
    });
});

router.post('/create_team', (req, res) => {
    const { name, division_id, season_no, region_id } = req.body;
    const record = '0-0';

    db.run('INSERT INTO teams (name, record, division_id, region_id, season_no) VALUES (?, ?, ?, ?, ?)', [name, record, division_id, region_id, season_no], (err) => {
        if (err) {
            console.error('Error creating team: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.redirect('/admin');
        }
    });
});

router.post('/create_match', (req, res) => {
    const { home_team_id, away_team_id, division_id, season_no, week_no, winner_id } = req.body;

    db.run('INSERT INTO matches (home_team_id, away_team_id, division_id, season_no, week_no, winner_id, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)',
        [home_team_id, away_team_id, division_id, season_no, week_no, winner_id], (err) => {
            if (err) {
                console.error('Error creating match: ' + err.message);
                res.status(500).send('Internal Server Error');
            } else {
                res.redirect('/admin');
            }
        });
});

router.post('/create_division', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO divisions (name) VALUES (?)', [name], (err) => {
        if (err) {
            console.error('Error creating division: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.redirect('/admin');
        }
    });
});

router.post('/create_region', (req, res) => {
    const { name } = req.body;
    db.run('INSERT INTO regions (name) VALUES (?)', [name], (err) => {
        if (err) {
            console.error('Error creating region: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.redirect('/admin');
        }
    });
});

router.post('/submit_match_result', (req, res) => {
    const { match_id, winner_id, loser_score } = req.body;

    db.run('UPDATE matches SET winner_id = ?, loser_score = ? WHERE id = ?', 
        [winner_id, loser_score, match_id], (err) => {
        if (err) {
            console.error('Error updating match result: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else {
            console.log(`Updated match ${match_id} with winner_id ${winner_id} and loser_score ${loser_score}`);
            
            db.run('UPDATE teams SET record = (CAST(SUBSTR(record, 1, INSTR(record, "-") - 1) AS INTEGER) + 1) || "-" || SUBSTR(record, INSTR(record, "-") + 1) WHERE id = ?', 
                [winner_id], (err) => {
                if (err) {
                    console.error('Error updating winner record: ' + err.message);
                }
            });

            if (loser_score > 0) {
                db.run('UPDATE teams SET record = SUBSTR(record, 1, INSTR(record, "-") - 1) || "-" || (CAST(SUBSTR(record, INSTR(record, "-") + 1) AS INTEGER) + 1) WHERE id = (SELECT CASE WHEN away_team_id = ? THEN home_team_id ELSE away_team_id END FROM matches WHERE id = ?)', 
                    [winner_id, match_id], (err) => {
                    if (err) {
                        console.error('Error updating loser record: ' + err.message);
                    }
                });
            }
            
            res.redirect('/admin'); 
        }
    });
});


export default router;
