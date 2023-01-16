import { Article } from './Article';

export class Backup {
    public Version: string | undefined;
    public TimeStamp: number | undefined;
    public UserSettings: UserSettings | undefined;
    public LearningDB: {upvotes: number, downvotes: number, keywords: {id: string, score: number}} | undefined;
    public Saved: Article[] | undefined;

    public static async MakeBackup(): Promise<Backup> {
        await Backend.CheckDB();
        const b = new Backup();
        b.Version = Backend.DB_VERSION;
        b.TimeStamp = Date.now();
        b.UserSettings = Backend.UserSettings;
        b.LearningDB = await Backend.StorageGet('learning_db');
        b.Saved = await Backend.StorageGet('saved');
        return b;
    }
    /* Creates a backup/export in the form of JSON string. */
    public static async CreateBackup(): Promise<string> {
        return JSON.stringify(await Backup.MakeBackup());
    }
    /* Export feed urls into an OPML xml document. */
    public static async ExportOPML(): Promise<string> {
        const doc = new DOMParser().parseFromString('<opml version="1.0"></opml>');
        const root = doc.getElementsByTagName('opml')[0];
        const body = doc.createElement('body');
        this.UserSettings.FeedList.forEach( (feed: Feed) => {
            const outline = doc.createElement('outline');
            outline.setAttribute('text', feed.name);
            outline.setAttribute('xmlUrl', feed.url);
            outline.setAttribute('type', 'rss');
            body.appendChild(outline);
        });
        root.appendChild(body);
        const serializer = new XMLSerializer();
        return serializer.serializeToString(root);
    }
    /* Wipes current data and loads backup created by CreateBackup() method. */
    public static async TryLoadBackup(backupStr: string): Promise<boolean> {
        const log = this.log.context('LoadBackup');
        try {
            const backup: Backup = JSON.parse(backupStr);
            if (backup.TimeStamp !== undefined)
                log.info(`Loading from ${(new Date(backup.TimeStamp)).toISOString()}, ver.: ${backup.Version}`);
            else
                log.info('Backend: Loading from (unknown date)');

            if (backup.Version === undefined)
                throw Error('Cannot determine backup version.');
            if (parseInt(backup.Version.split('.')[0]) != parseInt(this.DB_VERSION.split('.')[0]))
                throw Error(`Version mismatch! Backup: ${backup.Version}, current: ${this.DB_VERSION}`);
            
            if (backup.UserSettings !== undefined) {
                await this.StorageSave('user_settings', await this.MergeUserSettings(new UserSettings(), backup.UserSettings));
                await this.RefreshUserSettings();
            }
            if (backup.LearningDB !== undefined)
                await this.StorageSave('learning_db', {... (await this.StorageGet('learning_db')), ...backup.LearningDB});
            if (backup.Saved !== undefined)
                await this.StorageSave('saved', backup.Saved);
            log.info('Backup loaded.');
            return true;
        } catch (err) {
            log.warn('Failed to load backup, will try OPML format parsing.',err);
            try {
                const parser = new DOMParser({
                    locator:{},
                    errorHandler:{warning:() => {},error:() => {},fatalError:(e:any) => { throw e; }} //eslint-disable-line
                });
                const doc = parser.parseFromString(backupStr);
                const feeds: Feed[] = [];
                const elems = doc.getElementsByTagName('outline');
                for (let i = 0; i < elems.length; i++) {
                    try {
                        feeds.push(new Feed(elems[i].getAttribute('xmlUrl')));
                    }  catch { /* dontcare */ }
                }
                log.info(`Importing OPML, imported ${feeds.length} feed(s).`);
                
                feeds.forEach(feed => {
                    if (this.FindFeedByUrl(feed.url, this.UserSettings.FeedList) < 0)
                        this.UserSettings.FeedList.push(feed);
                    else
                        log.debug(`(opml) skipping (already in feedlist) '${feed.url}'`);
                });
                await this.UserSettings.Save();

                log.info('Backup/Import (OPML) loaded.');
                return true;
            } catch (err) {
                log.error('Failed to load backup both as JSON and OMPL.', err);
                return false;
            }
        }
    }
}
