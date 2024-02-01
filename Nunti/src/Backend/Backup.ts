import Log from '../Log';
import { Article } from './Article';
import { Feed } from './Feed';
import { Storage } from './Storage';
import { UserSettings } from './UserSettings';
import { Utils } from './Utils';
const DOMParser = require('@xmldom/xmldom').DOMParser; //eslint-disable-line
const XMLSerializer = require('@xmldom/xmldom').XMLSerializer; //eslint-disable-line

export class Backup {
    public Version: string | undefined;
    public TimeStamp: number | undefined;
    public UserSettings: UserSettings | undefined;
    public LearningDB: {upvotes: number, downvotes: number, keywords: {id: string, score: number}} | undefined;
    public Saved: Article[] | undefined;

    public static async MakeBackup(): Promise<Backup> {
        await Storage.CheckDB();
        const b = new Backup();
        b.Version = Storage.DB_VERSION;
        b.TimeStamp = Date.now();
        b.UserSettings = UserSettings.Instance;
        b.LearningDB = await Storage.StorageGet('learning_db');
        b.Saved = await Storage.StorageGet('saved');
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
        UserSettings.Instance.FeedList.forEach( (feed: Feed) => {
            const outline = doc.createElement('outline');
            outline.setAttribute('text', feed.name);
            outline.setAttribute('title', feed.name);
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
        const log = Log.BE.context('LoadBackup');
        try {
            const backup: Backup = JSON.parse(backupStr);
            if (backup.TimeStamp !== undefined)
                log.info(`Loading from ${(new Date(backup.TimeStamp)).toISOString()}, ver.: ${backup.Version}`);
            else
                log.info('Backend: Loading from (unknown date)');

            if (backup.Version === undefined)
                throw Error('Cannot determine backup version.');
            if (parseInt(backup.Version.split('.')[0]) != parseInt(Storage.DB_VERSION.split('.')[0]))
                throw Error(`Version mismatch! Backup: ${backup.Version}, current: ${Storage.DB_VERSION}`);
            
            if (backup.UserSettings !== undefined) {
                await Storage.StorageSave('user_settings', await UserSettings.MergeUserSettings(new UserSettings(), backup.UserSettings));
                await UserSettings.RefreshUserSettings();
            }
            if (backup.LearningDB !== undefined)
                await Storage.StorageSave('learning_db', {... (await Storage.StorageGet('learning_db')), ...backup.LearningDB});
            if (backup.Saved !== undefined)
                await Storage.StorageSave('saved', backup.Saved);
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
                        const feed = new Feed(elems[i].getAttribute('xmlUrl'));
                        if (elems[i].hasAttribute('text') && elems[i].getAttribute('text').trim() != '')
                            feed.name = elems[i].getAttribute('text').trim();
                        if (elems[i].hasAttribute('title') && elems[i].getAttribute('title').trim() != '')
                            feed.name = elems[i].getAttribute('title').trim();
                        feeds.push(feed);
                    }  catch { /* dontcare */ }
                }
                log.info(`Importing OPML, imported ${feeds.length} feed(s).`);
                
                feeds.forEach(feed => {
                    if (Utils.FindFeedByUrl(feed.url, UserSettings.Instance.FeedList) < 0)
                        UserSettings.Instance.FeedList.push(feed);
                    else
                        log.debug(`(opml) skipping (already in feedlist) '${feed.url}'`);
                });
                await UserSettings.Save();

                log.info('Backup/Import (OPML) loaded.');
                return true;
            } catch (err) {
                log.error('Failed to load backup both as JSON and OMPL.', err);
                return false;
            }
        }
    }
}
