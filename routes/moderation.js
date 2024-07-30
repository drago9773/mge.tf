
import express from 'express';

const router = express.Router();

router.get('/', (req, res) => {
  return res.render('layout', { title: 'Moderation', body: 'moderation', session: req.session });
})

export default router;