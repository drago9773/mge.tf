import express from 'express';
import db from '../db.js'; // Adjust the path as per your project structure

const router = express.Router();

router.get('/', async (req, res) => {
  console.log('We hittin');
  let users = await db.get('SELECT * FROM users');
  console.log(users);
  res.status(200);
  return res.render('layout', {title: 'Test Page', body: 'test', cake: 'chocolate'})
});

export default router;