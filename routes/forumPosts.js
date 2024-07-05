import express from 'express';
import db from '../db.js';
import moment from 'moment';

const router = express.Router()

const MAX_POSTS = 3;

const REFRESH_PERIOD = 3600000;

router.get('/create_post', (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ error: 'You must be logged in to do this' });
    }
    res.render('layout', { title: 'Create Thread', body: 'create_post', session: req.session });
});

router.get('/forums', (req, res) => {
    const session = req.session;
    const sql = `SELECT threads.id, threads.title, threads.content, threads.created_at, threads.bumped_at, threads.owner,
                        users.steam_username
                 FROM threads
                 LEFT JOIN users ON threads.owner = users.steam_id
                 ORDER BY threads.bumped_at DESC`;

    db.all(sql, [], (err, threadRows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch threads.' });
        }

        const threads = threadRows.map(thread => {
            try {
                const createdAt = moment(thread.created_at);
                thread.formatted_date = createdAt.format('MM/DD/YYYY HH:mm:ss');
            } catch (error) {
                console.error('Error formatting date:', error);
                thread.formatted_date = 'Unknown Date';
            }
            return thread;
        });

        db.all('SELECT steam_id FROM moderators', [], (err, moderators) => {
            if (err) {
                console.error('Error querying database: ' + err.message);
                return res.status(500).send('Internal Server Error');
            }

            res.render('layout', {
                title: 'Forums',
                body: 'forums',
                threads: threads,
                session: session,
                moderators: moderators.map(mod => mod.steam_id)
            });
        });
    });
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

    db.get('SELECT * FROM activity WHERE owner = ?', [user.steamid], (err, activityRow) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve activity data.' });
        }
        const current_time = Date.now();
        let threadCount = 0;
        let lastPeriod = current_time;
        if (activityRow) {
            threadCount = activityRow.thread_count;
            lastPeriod = activityRow.period;
            if (current_time - lastPeriod >= REFRESH_PERIOD) {
                threadCount = 0;
                lastPeriod = current_time;
            }
        }
        if (threadCount >= MAX_POSTS) {
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later. ' })
        }
        const now = new Date().toISOString();
        db.run('INSERT INTO threads (title, content, owner, created_at, bumped_at) VALUES (?, ?, ?, ?, ?)',
            [title, content, user.steamid, now, now], function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to post content.' });
                } else {
                    if (activityRow) {
                        db.run('UPDATE activity SET thread_count = ?, period = ? WHERE owner = ?', [threadCount + 1, lastPeriod, user.steamid])
                    } else {
                        db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [1, 0, current_time, user.steamid]);
                    }
                    return res.redirect('/forums');
                }
            });
    });
});

router.post('/thread', (req, res) => {
    const { content, thread_id } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    db.get('SELECT * FROM activity WHERE owner = ?', [user.steamid], (err, activityRow) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve activity data.' });
        }

        const current_time = Date.now();
        let postCount = 0;
        let lastPeriod = current_time;

        if (activityRow) {
            postCount = activityRow.post_count;
            lastPeriod = activityRow.period;

            if (current_time - lastPeriod >= REFRESH_PERIOD) {
                postCount = 0;
                lastPeriod = current_time;
            }
        }

        if (postCount >= MAX_POSTS) {
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later. ' })
        }

        db.run('INSERT INTO posts (content, thread, owner) VALUES (?, ?, ?)', [content, thread_id, user.steamid], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).json({ error: 'Failed to post content.' });
            } else {

                if (activityRow) {
                    db.run('UPDATE activity SET post_count = ?, period = ? WHERE owner = ?', [postCount + 1, lastPeriod, user.steamid])
                } else {
                    db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [0, 1, current_time, user.steamid]);
                }

                return res.status(200).redirect('/thread/' + thread_id);
            }
        });
    });
});

router.post('/remove_reply', (req, res) => {
    const replyId = req.body.reply_id;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userSteamId = user.steamid;

    const sqlCheckReply = `
        SELECT posts.*, threads.owner as thread_owner 
        FROM posts 
        JOIN threads ON posts.thread = threads.id 
        WHERE posts.id = ?`;

    db.get(sqlCheckReply, [replyId], (err, reply) => {
        if (err) {
            console.error('Error verifying reply:', err.message);
            return res.status(500).json({ error: 'Failed to verify reply.' });
        }
        if (!reply) {
            return res.status(404).json({ error: 'Reply not found.' });
        }

        db.get('SELECT * FROM moderators WHERE steam_id = ?', [userSteamId], (err, moderator) => {
            if (reply.owner !== userSteamId && reply.thread_owner !== userSteamId && !moderator) {
                return res.status(403).json({ error: 'You do not have permission to delete this reply.' });
            }

            const sqlDeleteReply = 'DELETE FROM posts WHERE id = ?';
            db.run(sqlDeleteReply, [replyId], (err) => {
                if (err) {
                    console.error('Error deleting reply:', err.message);
                    return res.status(500).json({ error: 'Failed to delete reply.' });
                }

                return res.redirect(`/thread/${reply.thread}`);
            });
        });
    });
});


router.get('/thread/:threadId', (req, res) => {
    const session = req.session;
    const threadId = req.params.threadId;

    const threadQuery = `
        SELECT threads.*, users.steam_username
        FROM threads
        LEFT JOIN users ON threads.owner = users.steam_id
        WHERE threads.id = ?`;

    db.get(threadQuery, [threadId], (err, thread) => {
        if (err) {
            console.error('Error querying thread:', err.message);
            return res.status(500).send('Internal Server Error');
        }
        if (!thread) {
            return res.status(404).send('Thread not found');
        }

        const repliesQuery = `
            SELECT posts.*, users.steam_username
            FROM posts
            LEFT JOIN users ON posts.owner = users.steam_id
            WHERE posts.thread = ?
            ORDER BY posts.created_at ASC`;

        db.all(repliesQuery, [threadId], (err, replies) => {
            if (err) {
                console.error('Error querying replies:', err.message);
                return res.status(500).send('Internal Server Error');
            }

            db.all('SELECT steam_id FROM moderators', [], (err, moderators) => {
                if (err) {
                    console.error('Error querying moderators:', err.message);
                    return res.status(500).send('Internal Server Error');
                }

                res.render('layout', {
                    title: thread.title,
                    body: 'thread',
                    session: session,
                    moderators: moderators.map(mod => mod.steam_id),
                    replies: replies,
                    thread: thread
                });
            });
        });
    });
});

router.post('/thread/:threadId/reply', (req, res) => {
    const { content } = req.body;
    const threadId = req.params.threadId;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to reply to this thread' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Reply content is required' });
    }

    db.get('SELECT * FROM activity WHERE owner = ?', [user.steamid], (err, activityRow) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to retrieve activity data.' });
        }

        const currentTime = Date.now();
        let postCount = 0;
        let lastPeriod = currentTime;

        if (activityRow) {
            postCount = activityRow.post_count;
            lastPeriod = activityRow.period;

            if (currentTime - lastPeriod >= REFRESH_PERIOD) {
                postCount = 0;
                lastPeriod = currentTime;
            }
        }

        if (postCount >= MAX_POSTS) {
            return res.status(400).json({ error: 'You have reached the limit of posts. Try again later.' });
        }

        const now = new Date().toISOString();
        db.run('INSERT INTO posts (content, thread, owner, created_at) VALUES (?, ?, ?, ?)',
            [content, threadId, user.steamid, now], function (err) {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to post reply.' });
                } else {

                    // Update the thread's bumped_at time
                    db.run('UPDATE threads SET bumped_at = ? WHERE id = ?', [now, threadId]);

                    if (activityRow) {
                        db.run('UPDATE activity SET post_count = ?, period = ? WHERE owner = ?', [postCount + 1, lastPeriod, user.steamid]);
                    } else {
                        db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [0, 1, currentTime, user.steamid]);
                    }

                    return res.redirect(`/thread/${threadId}`);
                }
            });
    });
});

router.post('/remove_thread', (req, res) => {
    const threadId = req.body.thread_id;
    if (!req.session.user) {
        return res.status(401).json({ error: 'Unauthorized. Please log in.' });
    }

    const userSteamId = req.session.user.steamid;

    const sqlCheckThread = 'SELECT * FROM threads WHERE id = ? AND owner = ?';
    db.get(sqlCheckThread, [threadId, userSteamId], (err, thread) => {
        if (err) {
            console.error('Error verifying thread:', err.message);
            return res.status(500).json({ error: 'Failed to verify thread.' });
        }

        if (thread) {
            deleteThread();
        } else {
            db.get('SELECT * FROM moderators WHERE steam_id = ?', [userSteamId], (err, moderator) => {
                if (err) {
                    console.error('Error checking moderator status:', err.message);
                    return res.status(500).json({ error: 'Internal server error' });
                }

                if (moderator) {
                    deleteThread();
                } else {
                    return res.status(403).json({ error: 'You do not have permission to delete this thread.' });
                }
            });
        }
    });

    function deleteThread() {
        const sqlDeleteThread = 'DELETE FROM threads WHERE id = ?';
        db.run(sqlDeleteThread, [threadId], (err) => {
            if (err) {
                console.error('Error deleting thread:', err.message);
                return res.status(500).json({ error: 'Failed to delete thread.' });
            }

            const sqlDeletePosts = 'DELETE FROM posts WHERE thread = ?';
            db.run(sqlDeletePosts, [threadId], (err) => {
                if (err) {
                    console.error('Error deleting associated posts:', err.message);
                }

                return res.redirect('/forums');
            });
        });
    }
});

export default router;