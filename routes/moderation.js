
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  return res.render('layout', { title: 'Moderation', body: 'moderation', announcements: [], session: req.session });
})

export default router;