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

            const now = new Date();

            for (const reschedule of pendingReschedules) {
                if (!reschedule.reschedule || !reschedule.createdAt) {
                    console.warn(`Skipping invalid reschedule data:`, reschedule);
                    continue;
                }

                const createdAt = new Date(reschedule.createdAt);
                const diffInHours = (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60);
                console.log(diffInHours);
                if (diffInHours < 24) {
                    console.log(`Skipping reschedule (not yet 24 hours old):`, reschedule);
                    continue;
                }

                console.log("Processing reschedule: ", reschedule);

                await db.update(matches)
                    .set({ matchDateTime: reschedule.reschedule })
                    .where(eq(matches.id, reschedule.matchId));

                await db.update(match_comms)
                    .set({
                        rescheduleStatus: 1,
                        content: 'MATCH RESPONSE: Reschedule automatically accepted after 24 hours.',
                    })
                    .where(eq(match_comms.id, reschedule.id));
            }

            console.log(`${pendingReschedules.length} reschedule(s) processed.`);
        } catch (error) {
            console.error('Error in automatic reschedule confirmation:', error);
        }
    });
};
