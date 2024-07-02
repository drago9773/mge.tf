import express from 'express';
import db from '../db.js'; // Adjust the path as per your project structure
import moment from 'moment';

const router = express.Router()

// 3 posts per hour, 30 replies
const MAX_POSTS = 3;

// 1 hour
const REFRESH_PERIOD = 3600000;

router.get('/create_post', (req, res) => {
    res.render('layout', {title: 'Create Thread', body: 'create_post', session : req.session});
});

router.get('/forums', (req, res) => {
    const session = req.session;

    const sql = `SELECT threads.id as thread_id, threads.*, users.steam_username, users.steam_id, users.steam_avatar 
                 FROM threads 
                 LEFT JOIN users ON threads.owner = users.id 
                 ORDER BY bumped_at DESC`;

    db.all(sql, [], (err, forumRows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to fetch posts.' });
        }

        const forums = forumRows.map(forum => {
            try {
                const createdAt = moment(forum.created_at);
                forum.formatted_date = createdAt.format('MM/DD/YYYY HH:mm:ss');
            } catch (error) {
                console.error('Error formatting date:', error);
            }
            return forum;
        });

        db.all(`SELECT users.*, moderators.id as moderator_id
                FROM moderators
                JOIN users ON moderators.user_id = users.id`, [], (err, moderators) => {
            if (err) {
                console.error('Error querying database: ' + err.message);
                return res.status(500).send('Internal Server Error');
            }

            res.render('layout', { title: 'Forums', body: 'forums', forums: forums, session: session, moderators: moderators });
        });
    });
});

router.post('/postContent', async (req, res) => {
    const { content, title } = req.body;
    const user = req.session.user;

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content || !title) {
        return res.status(400).json({ error: 'Content and title are required' });
    }

    console.log(user);
    db.get('SELECT id FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to post content.' });
        }

        const user_id = row.id;

        db.get('SELECT * FROM activity WHERE owner = ?', [user_id], (err, activityRow) => {
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
                console.log('You have reached max numebr of posts')
                return res.status(400).json({ error: 'You have reached the limit of posts. Try again later. ' })
            }

            db.run('INSERT INTO threads (title, content, owner) VALUES (?, ?, ?)', [title, content, user_id], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to post content.' });
                } else {
                    console.log(`Forum Post "${content}" saved to the database.`);

                    if (activityRow) {
                        db.run('UPDATE activity SET thread_count = ?, period = ? WHERE owner = ?', [threadCount + 1, lastPeriod, user_id])
                    } else {
                        db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [1, 0, current_time, user_id]);
                    }

                    return res.status(200).redirect('/forums');
                }
            });
        });
    });
});

router.post('/posts', (req, res) => {
    const { content, thread_id } = req.body;
    const user = req.session.user;

    console.log(req.body);

    if (!user) {
        return res.status(401).json({ error: 'Login to create post' });
    }

    if (!content) {
        return res.status(400).json({ error: 'Content is required' });
    }

    db.get('SELECT id FROM users WHERE steam_id = ?', [user.steamid], (err, row) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: 'Failed to post content.' });
        }
        const user_id = row.id;

        db.get('SELECT * FROM activity WHERE owner = ?', [user_id], (err, activityRow) => {
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
                console.log('You have reached max numebr of posts')
                return res.status(400).json({ error: 'You have reached the limit of posts. Try again later. ' })
            }

            db.run('INSERT INTO posts (content, thread, owner) VALUES (?, ?, ?)', [content, thread_id, user_id], (err) => {
                if (err) {
                    console.error(err.message);
                    return res.status(500).json({ error: 'Failed to post content.' });
                } else {
                    console.log(`Post "${content}" saved to the database.`);

                    if (activityRow) {
                        db.run('UPDATE activity SET post_count = ?, period = ? WHERE owner = ?', [postCount + 1, lastPeriod, user_id])
                    } else {
                        db.run('INSERT INTO activity (thread_count, post_count, period, owner) VALUES (?, ?, ?, ?)', [1, 0, current_time, user_id]);
                    }

                    return res.status(200).redirect('/post/' + thread_id);
                }
            });
        });
    });
});

router.post('/remove_post', (req, res) => {
    const postId = req.body.post_id;
    const mod = req.body.is_moderator;
    const owner = req.body.is_owner;

    console.log(owner);
    console.log(mod);
    if (!owner || !mod) {
        return res.status(403).send('Unauthorized');
    }

    const sqlCheckPost = 'SELECT * FROM threads WHERE id = ?';
    db.get(sqlCheckPost, [postId], (err, post) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Failed to verify post.');
        }

        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const sqlDeletePost = 'DELETE FROM threads WHERE id = ?';
        db.run(sqlDeletePost, [postId], (err) => {
            if (err) {
                console.error(err.message);
                return res.status(500).send('Failed to delete post.');
            }
            return res.redirect('/');
        });
    });
});

router.post('/remove_reply', (req, res) => {
    const replyId = req.body.reply_id;
    const mod = req.body.is_moderator;
    const owner = req.body.is_owner;

    console.log(owner);
    console.log(mod);
    console.log(replyId);

    if (!owner || !mod) {
        return res.status(403).send('Unauthorized');
    }

    const sqlCheckPost = 'SELECT * FROM posts WHERE id = ?';
    db.get(sqlCheckPost, [replyId], (err, post) => {
        if (err) {
            console.error(err.message);
            return res.status(500).send('Failed to verify post.');
        }

        if (!post) {
            return res.status(404).send('Post not found.');
        }

        const sqlDeletePost = 'DELETE FROM posts WHERE id = ?';
        console.log('3')
        db.run(sqlDeletePost, [replyId], (err) => {
            console.log('4')
            if (err) {
                console.log('5')
                console.error(err.message);
                return res.status(500).send('Failed to delete post.');
            }
            console.log('6')
            return res.redirect('/post/' + post.thread);
        });
    });
});


router.get('/post/:forumid', (req, res) => {
    const session = req.session;
    const forumid = req.params.forumid;

    db.get('SELECT threads.id as thread_id, * FROM threads LEFT JOIN users ON threads.owner = users.id WHERE threads.id = ?', [forumid], (err, row) => {
        if (err) {
            console.error('Error querying database: ' + err.message);
            return res.status(500).send('Internal Server Error');
        }

        db.all(`SELECT posts.*, users.steam_username, users.steam_id, users.steam_avatar
            FROM posts LEFT JOIN users ON 
            posts.owner = users.id WHERE thread = ?`, [forumid], (err, posts) => {

            if (err) {
                console.error('Error querying database: ' + err.message);
                return res.status(500).send('Internal Server Error');
            }

            db.all(`SELECT users.*, moderators.id as moderator_id
                    FROM moderators
                    JOIN users ON moderators.user_id = users.id`, [], (err, moderators) => {
                if (err) {
                    console.error('Error querying database: ' + err.message);
                    return res.status(500).send('Internal Server Error');
                }

                res.render('layout', {title: 'Thread', body: 'posts', session: session, moderators: moderators, posts: posts, thread: row });
            });
        });
    });
});

export default router;