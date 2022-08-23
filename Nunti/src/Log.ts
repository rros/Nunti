/* Basic usage:
 *  Get contexted logger for frontend: Log.FE
 *
 *  you can call .context('contextName') to create sub-contexts
 *      i.e.: Log.FE.context('Settings').context('MyModal')
 *  otherwise normal console-like .debug(), .info(), etc. is implemented
 *
 *  Recommended way to handle contexts is to create a parent Log and make sub-contexts by calling parentLog.context(..)
 *  as opposed to always rebuilding Log from scratch (prone to inconsistencies and more performance overhead)
 */

export default class Log {
    private contexts: string[] = [];

    public static get FE(): Log {
        return Log.context('FE');
    }
    public static get BE(): Log {
        return Log.context('BE');
    }
    
    public static context(ctx: string): Log {
        const log = new Log();
        log.contexts.push(ctx);
        return log;
    }
    public context(ctx: string): Log {
        const log = new Log();
        log.contexts = this.contexts.slice(0, this.contexts.length);
        log.contexts.push(ctx);
        return log;
    }

    public info(...params: unknown[]): void {
        console.info(this.buildContexts(), ...params);
    }
    public debug(...params: unknown[]): void {
        console.debug(this.buildContexts(), ...params);
    }
    public warn(...params: unknown[]): void {
        console.warn(this.buildContexts(), ...params);
    }
    public error(...params: unknown[]): void {
        console.error(this.buildContexts(), ...params);
    }

    private buildContexts(): string {
        return `[${this.contexts.join(',')}]:`;
    }
}
