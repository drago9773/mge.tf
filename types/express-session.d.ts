import 'express-session';

declare module 'express-session' {
    interface SessionData {
        user?: {
            steamid: string;
            permissionLevel?: number;
            isSignedUp?: number;
            _json: Record<string, any>;
            username: string;
            name: string;
            profile: string;
            avatar: {
                small: string;
                medium: string;
                large: string;
            };
        };
        returnTo?: string;
    }
}
