import express from 'express';
import { db, isAdmin } from '../db.ts';
import { demo_report, demos, users } from '../schema.ts';
import { eq } from 'drizzle-orm';

const router = express.Router();

router.post('/admin/review/:reportId', async (req, res) => {
    const { status, adminComments } = req.body;
    const reportId = parseInt(req.params.reportId, 10);
  
    if (isNaN(reportId)) {
      return res.status(400).send('Invalid report ID');
    }
  
    const adminId = req.session.user?.steamid;
    const adminStatus = isAdmin(req.session?.user?.steamid);
    if (!adminStatus) {
        return res.status(403).redirect('/');
    }
    
    try {
      await db.update(demo_report)
        .set({
          status: status,
          adminComments: adminComments,
          adminId: adminId
        })
        .where(eq(demo_report.id, reportId));
    
      res.redirect('/admin');
    } catch (err) {
      console.error('Error updating demo report:', err);
      res.status(500).send('Internal Server Error');
    }
  });  
  
export default router;