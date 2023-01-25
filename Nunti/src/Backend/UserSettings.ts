import Log from '../Log';
import { Feed } from './Feed';
import { Storage } from './Storage';
import { Tag } from './Tag';

export class UserSettings {
    public static Instance: UserSettings;

    public FeedList: Feed[] = [];
    public Tags: Tag[] = [];

    public DisableImages = false;
    public LargeImages = true;
    public WifiOnly = false;
    public BrowserMode = 'webview';
    public MaxArticleAgeDays = 7;

    public Language = 'system';
    public Theme = 'system';
    public Accent = 'default';

    public FirstLaunch = true;
    
    public DisableBackgroundTasks = true; //disables all background tasks
    public EnableBackgroundSync = false; //synchronizes articles in background before cache expires
    public EnableNotifications = false;
    /* "daily" notif. with recommended article;
     * period in minutes
     * !minimum is 15 minutes! */
    public NewArticlesNotificationPeriod = 12*60;
    public EnableAutomaticBackups = false;
    public AutomaticBackupPeriod = 1*24; //in hours
    public AutomaticBackupDir = '';

    /* Advanced */
    public DiscoverRatio = 0.1; //0.1 means 10% of articles will be random (preventing bubble effect)
    public ArticleCacheTime: number = 3*60; //minutes
    public MaxArticlesPerChannel = 20;
    public NoSortUntil = 50; //do not sort by preferences until X articles have been rated
    public RotateDBAfter = this.NoSortUntil * 2; //effectively evaluate only last X ratings when scoring articles
    public SeenHistoryLength = 700; //to prevent flooding storage with seen articles history
    public FeedPageSize = 20; //articles per page
    public ArticleHistory = 40; //length (articles count) of history display to user

    /* Not settings, just user-related info. */
    public TotalUpvotes = 0;
    public TotalDownvotes = 0;
    public LastBackupTimestamp = 0;

    public static async Save(): Promise<void> {
        await Storage.StorageSave('user_settings', UserSettings.Instance);
    }
    public static async Refresh(): Promise<void> {
        await UserSettings.RefreshUserSettings();
    }
    public async Save(): Promise<void> {
        await UserSettings.Save();
    }
    public async Refresh(): Promise<void> {
        await UserSettings.Refresh();
    }

    private static log: Log = Log.BE.context('UserSettings');

    /* Re-load and recheck UserSettings from storage. (unsaved changes will be lost) */
    public static async RefreshUserSettings(noCheckDb = false): Promise<void> {
        if (!noCheckDb)
            await Storage.CheckDB();

        this.log.context('RefreshUserSettings').debug('Refreshing...');
        this.Instance = Object.assign(new UserSettings(), await Storage.StorageGet('user_settings'));
        this.Instance.FeedList.sort((a: Feed, b: Feed) => {
            if ((a.name ?? undefined) !== undefined && (b.name ?? undefined) !== undefined)
                return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
            else
                return -1;
        });
        this.Instance.Tags.sort((a: Tag, b: Tag) => {
            if ((a.name ?? undefined) !== undefined && (b.name ?? undefined) !== undefined)
                return b.name.toLowerCase() < a.name.toLowerCase() ? 1 : -1;
            else
                return -1;
        });
    }
    public static async MergeUserSettings(old: UserSettings, override: UserSettings): Promise<UserSettings> {
        const prefs = Object.assign(old, override);
        // cycle through Feeds and merge them, otherwise new properties will be undefined in next update
        for (let i = 0; i < prefs.FeedList.length; i++) {
            try {
                prefs.FeedList[i] = Object.assign(new Feed(prefs.FeedList[i].url), prefs.FeedList[i]);
            } catch {
                this.log.context('MergeUserSettings').warn(`failed to merge feed ${prefs.FeedList[i].url}`);
            }
        }
        return prefs;
    }
}
