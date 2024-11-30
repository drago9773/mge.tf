import cron from 'node-cron';
import { db } from '../../db.ts';
import { sql, and, eq, gte } from 'drizzle-orm';
import { match_comms, matches } from '../../schema.ts';

export const scheduleTasks = () => {
    cron.schedule('* * * * *', async () => {
        console.log('Running automatic reschedule confirmation task...');
        try {
            const pendingReschedules = await db.select().from(match_comms).where(eq(match_comms.rescheduleStatus, 0));

            if (!pendingReschedules.length) {
                console.log("No pending reschedules found.");
                return;
            }

            const now = Date.now();

            for (const reschedule of pendingReschedules) {
                if (!reschedule.reschedule || !reschedule.createdAt) {
                    console.warn(`Skipping invalid reschedule data:`, reschedule);
                    continue;
                }
                const createdAt = reschedule.createdAt * 1000;
                const diffInHours = (now - createdAt) / (1000 * 60 * 60);

                if (diffInHours < 24) {
                    continue;
                }

                await db.update(matches)
                    .set({ matchDateTime: reschedule.reschedule })
                    .where(eq(matches.id, reschedule.matchId));

                await db.update(match_comms)
                    .set({
                        rescheduleStatus: 1,
                        content: 'AUTOMATED MATCH RESPONSE: Reschedule automatically accepted after 24 hours.',
                    })
                    .where(eq(match_comms.id, reschedule.id));
            }

            console.log(`${pendingReschedules.length} reschedule(s) processed.`);
        } catch (error) {
            console.error('Error in automatic reschedule confirmation:', error);
        }
    });
};
