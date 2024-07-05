import express from 'express';
import db from '../db.js';

const router = express.Router();

router.get('/admin', (req, res) => {
    db.all('SELECT * FROM teams', [], (err, teams) => {
        if (err) {
            console.error('Error fetching teams: ' + err.message);
            teams = [];
        }
        db.all(`SELECT matches.*, winners.name AS winner_name, losers.name AS loser_name,
                divisions.name AS division_name
                FROM matches 
                JOIN teams AS winners ON matches.winner_id = winners.id 
                JOIN teams AS losers ON matches.loser_id = losers.id
                JOIN divisions ON matches.division_id = divisions.id`, [], (err, matches) => {
            if (err) {
                console.error('Error fetching matches: ' + err.message);
                matches = [];
            }
            db.all('SELECT * FROM divisions', [], (err, divisions) => {
                if (err) {
                    console.error('Error fetching divisions: ' + err.message);
                    divisions = [];
                }
                res.render('admin', { title: 'Admin', session: req.session, teams, matches, divisions });
            });
        });
    });
});

router.post('/create_team', (req, res) => {
    const { name, division } = req.body;
    db.run('INSERT INTO teams (name, division, created_at) VALUES (?, ?, CURRENT_TIMESTAMP)', [name, division], (err) => {
        if (err) {
            console.error('Error creating team: ' + err.message);
            res.status(500).send('Internal Server Error');
        } else {
            res.redirect('/admin');
        }
    });
});

router.post('/create_match', (req, res) => {
    const { winner_id, loser_id, division_id, loser_score, season_no, week_no } = req.body;
    db.run('INSERT INTO matches (winner_id, loser_id, division_id, loser_score, season_no, week_no, created_at) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)', [winner_id, loser_id, division_id, loser_score, season_no, week_no], (err) => {
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

export default router;
