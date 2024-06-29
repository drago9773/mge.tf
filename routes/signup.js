import express from 'express';

const router = express.Router();

router.get('/1v1signup', async (req, res) => {
  res.status(200);
  return res.render('layout', {title: '1v1 Signups', body: '1v1signup', session: req.session})
});

router.get('/2v2signup', async (req, res) => {
  res.status(200);
  return res.render('layout', {title: '1v1 Signups', body: '2v2signup', session: req.session})
})

export default router;