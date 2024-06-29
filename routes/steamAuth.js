import SteamAuth from 'node-steam-openid';
import express from 'express';
import db from '../db.js';

const API_KEY = '2C7E4CDF46C4D4FB5875A8E6E040BFC0';
const domain = process.env.DOMAIN || 'http://localhost:3005/';

const steam = new SteamAuth({
    realm: domain,
    returnUrl: domain + 'verify',
    apiKey: API_KEY,
});

const router = express.Router();


router.get('/init-openid', async (req, res) => {
    const redirectUrl = await steam.getRedirectUrl();
    return res.redirect(redirectUrl);
});

router.get('/verify', async (req, res) => {
    try {
        const user = await steam.authenticate(req);
        req.session.user = user;

        // check if first time login
        db.get('SELECT * FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
            if (err) {
                console.error('Error querying database: ' + err.message);
            } else if (!row) {
                // add if first time
                db.run('INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES (?, ?, ?)', [user.steamid, user.username, user.avatar.small], (err) => {
                    if (err) {
                        console.error('Error inserting into database: ' + err.message);
                    }
                });
            }
        });
    } catch (err) {
        console.error('Authentication error: ' + err.message);
    }
    return res.redirect('/');
});

export default router;