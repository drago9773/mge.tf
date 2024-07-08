import SteamAuth from 'node-steam-openid';
import express from 'express';
import db, { isAdmin } from '../db.js'; 

const API_KEY = '2C7E4CDF46C4D4FB5875A8E6E040BFC0';
const domain = process.env.DOMAIN || 'http://localhost:3005/';
const steam = new SteamAuth({
    realm: domain,
    returnUrl: domain + 'verify',
    apiKey: API_KEY,
});

const router = express.Router();

router.get('/init-openid', async (req, res) => {
    req.session.returnTo = req.headers.referer || req.originalUrl || '/';
    const redirectUrl = await steam.getRedirectUrl();
    return res.redirect(redirectUrl);
});

router.get('/verify', async (req, res) => {
    try {
        const user = await steam.authenticate(req);
        req.session.user = user;
        req.session.user.isAdmin = await isAdmin(req.session.user.steamid);

        const addOrUpdateUser = new Promise((resolve, reject) => {
            db.get('SELECT * FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
                if (err) {
                    console.error('Error querying database: ' + err.message);
                    reject(err);
                } else if (!row) {
                    db.run('INSERT INTO users (steam_id, steam_username, steam_avatar) VALUES (?, ?, ?)',
                        [user.steamid, user.username, user.avatar.large],
                        function (err) {
                            if (err) {
                                console.error('Error inserting into database: ' + err.message);
                                reject(err);
                            } else {
                                resolve(this.lastID);
                            }
                        }
                    );
                } else {
                    if (row.steam_username !== user.username) {
                        db.run('UPDATE users SET steam_username = ? WHERE steam_id = ?',
                            [user.username, user.steamid],
                            (err) => {
                                if (err) {
                                    console.error('Error updating username: ' + err.message);
                                    reject(err);
                                } else {
                                    resolve(row.id);
                                }
                            }
                        );
                    } else {
                        resolve(row.id);
                    }
                }
            });
        });

        await addOrUpdateUser;
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        return res.redirect(returnTo);
    } catch (err) {
        console.error('Authentication error: ' + err.message);
        return res.redirect('/');
    }
});

export default router;