import SteamAuth from 'node-steam-openid';
import express from 'express';
import { db, permissionLevelFromSteamId } from '../db.ts';
import { users, UserRole } from '../schema.ts';
import { eq } from 'drizzle-orm';

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
        req.session.user = {
            ...user,
        };
        req.session.user.permissionLevel = permissionLevelFromSteamId(req.session?.user?.steamid);

        const existingUser = db.select().from(users).where(eq(users.steamId, user.steamid)).get();

        if (!existingUser) {
            await db.insert(users).values({
                steamId: user.steamid,
                steamUsername: user.username,
                steamAvatar: user.avatar.large
            });
        } else if (!existingUser.nameOverride && existingUser.steamUsername !== user.username) {
            await db.update(users)
                .set({ steamUsername: user.username })
                .where(eq(users.steamId, user.steamid));
        }
        if (existingUser && existingUser.permissionLevel < UserRole.ADMIN && existingUser?.isBanned === 1) {
            req.session.destroy(() => {});
            res.status(403);
            return res.redirect('/');
        }
        if (existingUser) {
            req.session.user.isSignedUp = Number(existingUser.isSignedUp);
        }
        const returnTo = req.session.returnTo || '/';
        delete req.session.returnTo;
        return res.redirect(returnTo);
    } catch (err) {
        console.error('Authentication error: ' + (err as Error).message);
        return res.redirect('/');
    }
});

export default router;