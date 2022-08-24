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

const RNFS = require('react-native-fs');

export default class Log {
    public static isRelease = false;
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
        LogStorage.log(this.contexts, 'info', ...params);
    }
    public debug(...params: unknown[]): void {
        if (!Log.isRelease) {
            console.debug(this.buildContexts(), ...params);
            LogStorage.log(this.contexts, 'debug', ...params);
        }
    }
    public warn(...params: unknown[]): void {
        console.warn(this.buildContexts(), ...params);
        LogStorage.log(this.contexts, 'warn', ...params);
    }
    public error(...params: unknown[]): void {
        console.error(this.buildContexts(), ...params);
        LogStorage.log(this.contexts, 'error', ...params);
    }
    public static async exportLogs(): Promise<string> {
        return await LogStorage.exportLogs();
    }

    private buildContexts(): string {
        return `[${this.contexts.join(',')}]:`;
    }
}

class LogObject {
    public timestamp = -1;
    public context: string[] = [];
    public level = 'debug';
    public data: unknown[] = [];
}

class LogStorage {
    private static logger = Log.context('LogStorage');
    private static queue: LogObject[] = [];
    private static lockQueue = true;
    private static initialized = false;
    
    public static async log(context: string[], level: string, ...data: unknown[]): Promise<void> {
        const obj: LogObject = {
            timestamp: Date.now(),
            context: context,
            level: level,
            data: data
        };
        
        if (!LogStorage.initialized)
            this.init();
        
        while (this.lockQueue)
            await new Promise(r => setTimeout(r, 200));
        this.queue.push(obj);
        if (this.queue.length > 10)
            this.flush();
    }
    private static async init(): Promise<void> {
        try {
            this.initialized = true;
            try {
                await RNFS.moveFile(RNFS.DocumentDirectoryPath + '/current.log', RNFS.DocumentDirectoryPath + '/last.log');
            } catch { /* nevermind */ }
            await RNFS.writeFile(RNFS.DocumentDirectoryPath + '/current.log', '', 'utf8');
            this.lockQueue = false;
            this.logger.debug('inited.');
        } catch (err) {
            this.logger.error('Cannot init!', err);
        }
    }
    private static async flush(): Promise<void> {
        if (this.lockQueue)
            return;
        this.lockQueue = true;
        let logs = '';
        while (this.queue.length > 0)
            logs += JSON.stringify(this.queue.pop()) + '\n';
        await RNFS.appendFile(RNFS.DocumentDirectoryPath + '/current.log', logs, 'utf8');
        this.lockQueue = false;
        this.logger.debug('flushed.');
    }
    public static async exportLogs(): Promise<string> {
        try {
            await this.flush();
            this.lockQueue = true;
            const current = (await RNFS.readFile(RNFS.DocumentDirectoryPath + '/current.log', 'utf8')).split('\n');
            let last: string[];
            try {
                last = (await RNFS.readFile(RNFS.DocumentDirectoryPath + '/last.log', 'utf8')).split('\n');
            } catch {
                last = [''];
            }
            this.lockQueue = false;
            current.sort((a: string, b:string) => {
                if (a == '' || b == '')
                    return -1;
                return JSON.parse(a).timestamp < JSON.parse(b).timestamp ? -1 : 1;
            });
            last.sort((a: string, b:string) => {
                if (a == '' || b == '')
                    return -1;
                return JSON.parse(a).timestamp < JSON.parse(b).timestamp ? -1 : 1;
            });
            return `-- Nunti logs exported at ${Date.now()} --\n-- Last:\n${last.join('\n')}\n-- Current:\n${current.join('\n')}\n-- EOF --\n`;
        } catch (err) {
            return `-- Nunti logs exported a ${Date.now()} --\nFailed to export: ${err}\n-- EOF --\n`;
        }
    }
}
