import express from 'express';
import { db } from '../db.ts';
import { discord } from '../schema.ts';
import session from 'express-session';

const router = express.Router();

// check .env
// const DISCORD_CLIENT_ID = 
// const DISCORD_CLIENT_SECRET = 
// const DISCORD_REDIRECT_URI = 'http://localhost:3005/auth/discord/callback';


router.get('/auth/discord/callback', async (req, res) => {
    const code = req.query.code as string | undefined;

    if (!code) {
        console.warn("Missing authorization code in callback.");
        return res.redirect('/?error=missing_code');
    }

    let tokenResponse;
    try {
        tokenResponse = await fetch('https://discord.com/api/oauth2/token', {
            method: 'POST',
            headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
            body: new URLSearchParams({
                client_id: DISCORD_CLIENT_ID!,
                client_secret: DISCORD_CLIENT_SECRET!,
                grant_type: 'authorization_code',
                code,
                redirect_uri: DISCORD_REDIRECT_URI!,
            }),
        }).then((res) => res.json());
    } catch (err) {
        console.error("Failed to fetch Discord token:", err);
        return res.redirect('/?error=token_request_failed');
    }

    if (tokenResponse.error || !tokenResponse.access_token) {
        console.error(`Discord OAuth2 Error: ${tokenResponse.error || 'No access token'}`);
        return res.redirect(`/?error=${tokenResponse.error || 'token_fetch_failed'}`);
    }

    const accessToken = tokenResponse.access_token;

    let userInfo;
    try {
        userInfo = await fetch('https://discord.com/api/users/@me', {
            headers: { Authorization: `Bearer ${accessToken}` },
        }).then((res) => res.json());
    } catch (err) {
        console.error("Failed to fetch Discord user info:", err);
        return res.redirect('/?error=user_info_request_failed');
    }

    const { id, username, avatar } = userInfo;
    const steamID = req.session?.user?.steamid;

    if (!steamID) {
        console.warn("SteamID not found in session.");
        return res.redirect('/');
    }

    try {
        await db.insert(discord).values({
            discordId: id,
            discordUsername: username,
            discordAvatar: avatar,
            playerSteamId: steamID,
        });
    } catch (err) {
        console.error("Failed to insert Discord user into database:", err);
        return res.redirect('/?error=db_insert_failed');
    }

    return res.redirect('/');
});

export default router;
