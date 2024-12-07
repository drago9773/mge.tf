import cron from 'node-cron';
import { db } from '../../db.ts';
import { eq } from 'drizzle-orm';
import { match_comms, matches, punishment, users } from '../../schema.ts';

const handleReschedules = async () => {
    console.log('Running automatic reschedule confirmation task...');
    try {
        const pendingReschedules = await db.select().from(match_comms).where(eq(match_comms.rescheduleStatus, 0));
        if (!pendingReschedules.length) {
            console.log("No pending reschedules.");
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

            console.log(`Reschedule accepted for match ${reschedule.matchId}`);
        }
    } catch (error) {
        console.error('Error in reschedule confirmation:', error);
    }
};

const handlePunishments = async () => {
    console.log('Running punishment expiration task...');
    try {
        const pendingPunishments = await db.select().from(punishment).where(eq(punishment.severity, 1));
        if (!pendingPunishments.length) {
            console.log("No pending punishments.");
            return;
        }

        const now = Date.now();

        for (const suspension of pendingPunishments) {
            if (!suspension.startDateTime || !suspension.duration || !suspension.playerSteamId) {
                console.warn(`Skipping invalid suspension data:`, suspension);
                continue;
            }
            const suspendedAt = suspension.startDateTime * 1000;
            const totalDuration = suspension.duration * 10;
            console.log("Now: ", now);
            console.log("SuspendedAt: ", suspendedAt);
            const diffInHours = (now - suspendedAt) / (1000 * 60 * 60);
            console.log("Dif in hours: ", diffInHours);

            if (diffInHours < suspension.duration) {
                continue;
            }

            await db.update(users)
                .set({ banStatus: 0 })
                .where(eq(users.steamId, suspension.playerSteamId));

            await db.update(punishment)
                .set({ status: 0 })
                .where(eq(punishment.id, suspension.id));

            console.log(`Suspension expired for player ${suspension.playerSteamId}`);
        }
    } catch (error) {
        console.error('Error in punishment expiration:', error);
    }
};

export const scheduleTasks = () => {
    cron.schedule('* * * * *', handleReschedules);
    cron.schedule('* * * * *', handlePunishments);
};
