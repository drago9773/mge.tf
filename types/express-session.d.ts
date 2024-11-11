import 'express-session';

declare module 'express-session' {
    interface SessionData {
        user?: {
            steamid: string;
            permissionLevel: number;
            // other properties if needed
        };
    }
}
