export class Storage {
    public static DB_VERSION = '3.1';
    private static DbLocked = false; //prevents running multiple CheckDB at the same time

    /* Resets cache */
    public static async ResetCache(): Promise<void> {
        this.log.context('ResetCache').info('Resetting cache..');
        await FSStore.setItem('cache', JSON.stringify({'timestamp': 0, 'articles': []}));
    }
    /* Resets all data in the app storage. */
    public static async ResetAllData(): Promise<void> {
        this.log.context('ResetAllData').warn('Resetting all data..');
        await AsyncStorage.clear();
        await this.ResetCache();
        await this.CheckDB();
        await this.RefreshUserSettings();
    }

    /* Save data to storage. */
    public static async StorageSave(key: string, value: any): Promise<void> { //eslint-disable-line
        this.log.context('StorageSave').debug(`Saving key '${key}'.`);
        await AsyncStorage.setItem(key,JSON.stringify(value));
    }
    /* Get data from storage. */
    public static async StorageGet(key:string): Promise<any> { //eslint-disable-line
        const data = await AsyncStorage.getItem(key);
        if (data === null)
            throw new Error(`Cannot retrieve data, possibly unknown key '${key}'.`);
        return JSON.parse(data);
    }
    /* Perform checkDB, makes sure things are not null and stuff. */
    public static async CheckDB(): Promise<void> {
        const log = this.log.context('CheckDB').context(`chkdb:${parseInt((Math.random() * 100).toString())}`);

        // queue mechanism
        if (!this.BackgroundLock) {
            await new Promise(r => setTimeout(r,parseInt(`${Math.random() * 1000}`)));
            while (this.DbLocked) {
                // failed queue, retry after random sleep
                log.info('Pending CheckDB..');
                await new Promise(r => setTimeout(r,parseInt(`${Math.random() * 2000}`)));
            }
            this.DbLocked = true;
            log.info('DB locked.');
        }

        try {
            if (await AsyncStorage.getItem('saved') === null) {
                log.debug('Init "saved" key in DB..');
                await AsyncStorage.setItem('saved',JSON.stringify([]));
            }
            if (await AsyncStorage.getItem('user_settings') === null) {
                log.debug('Init "user_settings" key in DB..');
                await AsyncStorage.setItem('user_settings',JSON.stringify(new UserSettings()));
            } else {
                const current = JSON.parse(await AsyncStorage.getItem('user_settings') ?? '{}');
                const merged = await this.MergeUserSettings(new UserSettings(), current);
                await AsyncStorage.setItem('user_settings', JSON.stringify(merged));
                await this.RefreshUserSettings(true);
            }
            if (await AsyncStorage.getItem('seen') === null) {
                log.debug('Init "seen" key in DB..');
                await AsyncStorage.setItem('seen',JSON.stringify([]));
            }
            if (await AsyncStorage.getItem('notifications-cache') === null) {
                log.debug('Init "notifications-cache" key in DB..');
                await AsyncStorage.setItem('notifications-cache',JSON.stringify({
                    seen_urls: [],
                    timestamp: 0,
                }));
            }
            if (await AsyncStorage.getItem('learning_db') === null) {
                log.debug('Init "learning_db" key in DB..');
                await AsyncStorage.setItem('learning_db',JSON.stringify({
                    upvotes:0, downvotes:0,
                    keywords:{}
                }));
                await AsyncStorage.removeItem('learning_db_secondary');
            }
            if (await AsyncStorage.getItem('learning_db_secondary') === null) {
                log.debug('Init "learning_db_secondary" key in DB..');
                const prefs = JSON.parse(await AsyncStorage.getItem('user_settings') ?? JSON.stringify(new UserSettings()));
                await AsyncStorage.setItem('learning_db_secondary',JSON.stringify({
                    upvotes: -prefs.RotateDBAfter / 4, downvotes: -prefs.RotateDBAfter / 4,
                    keywords:{}
                }));
            }
        } finally {
            log.info('DB unlocking now.');
            this.DbLocked = false;
        }
    }
    public static async GetArticleCache(): Promise<{timestamp: number | string, articles: Article[]}> {
        const log = this.log.context('GetArticleCache');
        const startTime = Date.now();
        let cache = await FSStore.getItem('cache');
        if (cache == null) {
            log.debug('Cache is null, initializing it.');
            cache = {'timestamp': 0, 'articles': []};
            await FSStore.setItem('cache',JSON.stringify(cache));
        } else {
            cache = JSON.parse(cache);
        }
        cache.articles.forEach((art: Article) => { Article.Fix(art); });
        const endTime = Date.now();
        log.debug(`Retrieved in ${endTime - startTime} ms.`);
        return cache;
    }
}