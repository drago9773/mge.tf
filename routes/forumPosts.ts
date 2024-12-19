import express from 'express';
import { db } from '../db.ts';
import moment from 'moment';
import { eq, desc, and } from 'drizzle-orm';
import { threads, users, posts, activity, moderators } from '../schema.ts';

const router = express.Router()

const MAX_POSTS = 3;
const MAX_REPLIES = 30;
const REFRESH_PERIOD = 3600000;

router.get('/create_post', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to do this' });
    }
    res.render('layout', { title: 'Create Thread', body: 'create_post', announcements: [], session: req.session });
});

router.get('/forums', async (req, res) => {
    const session = req.session;
    try {
        const threadRows = await db.select({
            id: threads.id,
            title: threads.title,
            content: threads.content,
            createdAt: threads.createdAt,
            bumpedAt: threads.bumpedAt,
            owner: threads.owner,
            steamUsername: users.steamUsername,
            hidden: threads.hidden,
        })
            .from(threads)
            .leftJoin(users, eq(threads.owner, users.steamId))
            .orderBy(desc(threads.bumpedAt));

        const formattedThreads = threadRows.map(thread => ({
            ...thread,
            formatted_date: moment(thread.createdAt).format('MM/DD/YYYY HH:mm:ss')
        }));

        const moderatorRows = await db.select().from(moderators);
        const moderatorIds = moderatorRows.map(mod => mod.steamId);

        res.render('layout', {
            title: 'Forums',
            body: 'forums',
            announcements: [],
            threads: formattedThreads,
            session: session,
            moderators: moderatorIds
        });
    } catch (err) {
        console.error('Error:', (err as Error).message);
        res.status(500).send('Internal Server Error');
    }
});

router.post('/create_thread', async (req, res) => {
    const { content, title } = req.body;
    const user = req.session.user;
    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }
    if (!content || !title) {
        return res.status(400).json({ error: 'Content and title are required' });
    }
    if (title.length > 150) {
        return res.status(400).json({ error: 'Title cannot be longer than 150 characters' })
    }
    if (content.length > 3000) {
        return res.status(400).json({ error: 'Content cannot be longer than 3000 characters' })
    }

    try {
        const activityRow = await db.select().from(activity).where(eq(activity.owner, user.steamid)).get();

        const current_time = Date.now();
        let threadCount = 0;
        let lastPeriod = current_time;
        if (activityRow) {
            threadCount = activityRow.threadCount;
            lastPeriod = activityRow.period;
            if (current_time - lastPeriod >= REFRESH_PERIOD) {
                threadCount = 0;
                lastPeriod = current_time;
            }
        }
        if (threadCount >= MAX_POSTS) {
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later.' })
        }

        const now = new Date().toISOString();
        await db.insert(threads).values({
            title,
            content,
            owner: user.steamid,
            createdAt: now,
            bumpedAt: now
        });

        if (activityRow) {
            await db.update(activity)
                .set({ threadCount: threadCount + 1, period: lastPeriod })
                .where(eq(activity.owner, user.steamid));
        } else {
            await db.insert(activity).values({
                threadCount: 1,
                postCount: 0,
                period: current_time,
                owner: user.steamid
            });
        }

        return res.redirect('/forums');
    } catch (err) {
        console.error('Error:', (err as Error).message);
        return res.status(500).json({ error: 'Failed to post content.' });
    }
});

router.post('/thread', async (req, res) => {
    const { content, thread_id } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    try {
        const activityRow = await db.select().from(activity).where(eq(activity.owner, user.steamid)).get();

        const current_time = Date.now();
        let postCount = 0;
        let lastPeriod = current_time;

        if (activityRow) {
            postCount = activityRow.postCount;
            lastPeriod = activityRow.period;

            if (current_time - lastPeriod >= REFRESH_PERIOD) {
                postCount = 0;
                lastPeriod = current_time;
            }
        }

        if (postCount >= MAX_POSTS) {
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later.' })
        }

        await db.insert(posts).values({
            content,
            thread: thread_id,
            owner: user.steamid,
            createdAt: new Date().toISOString()
        });

        if (activityRow) {
            await db.update(activity)
                .set({ postCount: postCount + 1, period: lastPeriod })
                .where(eq(activity.owner, user.steamid));
        } else {
            await db.insert(activity).values({
                threadCount: 0,
                postCount: 1,
                period: current_time,
                owner: user.steamid
            });
        }

        return res.status(200).redirect('/thread/' + thread_id);
    } catch (err) {
        console.error('Error:', (err as Error).message);
        return res.status(500).json({ error: 'Failed to post content.' });
    }
});

router.post('/remove_reply', async (req, res) => {
    const replyId = req.body.reply_id;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userSteamId = user.steamid;

    try {
        const reply = db.select({
            id: posts.id,
            content: posts.content,
            createdAt: posts.createdAt,
            thread: posts.thread,
            owner: posts.owner,
            hidden: posts.hidden,
            threadOwner: threads.owner,
        })
            .from(posts)
            .innerJoin(threads, eq(posts.thread, threads.id))
            .where(eq(posts.id, replyId))
            .get();


        if (!reply) {
            return res.status(404).json({ error: 'Reply not found.' });
        }

        const moderator = db.select().from(moderators).where(eq(moderators.steamId, userSteamId)).get();

        if (reply.owner !== userSteamId && reply.threadOwner !== userSteamId && !moderator) {
            return res.status(403).json({ error: 'You do not have permission to delete this reply.' });
        }

        await db.delete(posts).where(eq(posts.id, replyId));

        return res.redirect(`/thread/${reply.thread}`);
    } catch (err) {
        console.error('Error:', (err as Error).message);
        return res.status(500).json({ error: 'Failed to delete reply.' });
    }
});

router.get('/thread/:threadId', async (req, res) => {
    const session = req.session;
    const threadId = req.params.threadId;
    try {
        const thread = db.select({
            id: threads.id,
            title: threads.title,
            content: threads.content,
            createdAt: threads.createdAt,
            owner: threads.owner,
            hidden: threads.hidden, // List other columns as necessary
            steamUsername: users.steamUsername, // Add `steamUsername` from `users`
        })
            .from(threads)
            .leftJoin(users, eq(threads.owner, users.steamId))
            .where(eq(threads.id, Number(threadId)))
            .get();


        if (!thread) {
            return res.status(404).send('Thread not found');
        }

        const replies = await db.select({
            id: posts.id,
            content: posts.content,
            createdAt: posts.createdAt,
            thread: posts.thread,
            owner: posts.owner,
            hidden: posts.hidden, // Include other columns as necessary
            steamUsername: users.steamUsername,
        })
            .from(posts)
            .leftJoin(users, eq(posts.owner, users.steamId))
            .where(eq(posts.thread, Number(threadId)))
            .orderBy(posts.createdAt);


        const moderatorRows = await db.select().from(moderators);
        const moderatorIds = moderatorRows.map(mod => mod.steamId);

        res.render('layout', {
            title: thread.title,
            body: 'thread',
            announcements: [],
            session: session,
            moderators: moderatorIds,
            replies: replies,
            thread: thread,
        });
    } catch (err) {
        console.error('Error:', (err as Error).message);
        return res.status(500).send('Internal Server Error');
    }
});

router.post('/thread/:threadId/reply', async (req, res) => {
    const { content } = req.body;
    const threadId = req.params.threadId;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to reply to this thread' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Reply content is required' });
    }

    if (content.length > 3000) {
        return res.status(400).json({ error: 'Reply content is too long, maximum of 4000 characters' });
    }

    try {
        const activityRow = db.select().from(activity).where(eq(activity.owner, user.steamid)).get();

        const currentTime = Date.now();
        let postCount = 0;
        let lastPeriod = currentTime;

        if (activityRow) {
            postCount = activityRow.postCount;
            lastPeriod = activityRow.period;

            if (currentTime - lastPeriod >= REFRESH_PERIOD) {
                postCount = 0;
                lastPeriod = currentTime;
            }
        }

        if (postCount >= MAX_REPLIES) {
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later.' });
        }

        const now = new Date().toISOString();
        await db.insert(posts).values({
            content: String(content), // Ensure content is a string
            thread: Number(threadId), // Ensure thread is a number
            owner: String(user.steamid), // Ensure owner is a string
            createdAt: String(now), // Ensure createdAt is a string or appropriate SQL date
        });

        await db.update(threads)
            .set({ bumpedAt: now })
            .where(eq(threads.id, Number(threadId)));

        if (activityRow) {
            await db.update(activity)
                .set({ postCount: postCount + 1, period: lastPeriod })
                .where(eq(activity.owner, user.steamid));
        } else {
            await db.insert(activity).values({
                threadCount: 0,
                postCount: 1,
                period: currentTime,
                owner: user.steamid
            });
        }

        return res.redirect(`/thread/${threadId}`);
    } catch (err) {
        console.error('Error:', (err as Error).message);
        return res.status(500).json({ error: 'Failed to post reply.' });
    }
});

router.post('/remove_thread', async (req, res) => {
    const threadId = req.body.thread_id;
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userSteamId = req.session.user.steamid;

    try {
        const thread = db.select()
            .from(threads)
            .where(and(eq(threads.id, threadId), eq(threads.owner, userSteamId)))
            .get();

        if (thread) {
            await deleteThread();
        } else {
            const moderator = db.select()
                .from(moderators)
                .where(eq(moderators.steamId, userSteamId))
                .get();

            if (moderator) {
                await deleteThread();
            } else {
                return res.status(403).json({ error: 'You do not have permission to delete this thread.' });
            }
        }

        return res.redirect('/forums');
    } catch (err) {
        console.error('Error:', (err as Error).message);
        return res.status(500).json({ error: 'Failed to delete thread.' });
    }

    async function deleteThread() {
        await db.update(threads).set({ hidden: 1 }).where(eq(threads.id, threadId));
        await db.update(posts).set({ hidden: 1 }).where(eq(posts.thread, threadId));
    }
});

export default router;