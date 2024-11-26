declare module 'node-cron' {
    export function schedule(cronTime: string, onTick: () => void, onComplete?: () => void, start?: boolean, timeZone?: string): any;
    export function validate(cronTime: string): boolean;
    export const cron: { schedule: typeof schedule };
  }
  