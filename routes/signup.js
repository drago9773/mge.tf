import express from 'express';
import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { users } from '../schema.js';

const router = express.Router();

router.get('/1v1signup', async (req, res) => {
  res.status(200);
  return res.render('layout', { title: '1v1 Signups', body: '1v1signup', session: req.session })
});

router.get('/2v2signup', async (req, res) => {
  res.status(200);
  return res.render('layout', { title: '1v1 Signups', body: '2v2signup', session: req.session })
})

router.post('/', async (req, res) => {
  let { interested, ToS } = req.body;
  if (interested && ToS) {
    let updateResult = await db.update(users).set({ isSignedUp: 1 }).where(eq(users.steamId, req.session?.user?.steamid));
  }
  if (!interested && ToS) {
    let updateResult = await db.update(users).set({ isSignedUp: 0 }).where(eq(users.steamId, req.session?.user?.steamid));
  }
  res.status(200);
  return res.json({ status: 'Success' })
})

export default router;
