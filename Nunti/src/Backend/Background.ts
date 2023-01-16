export class Background {
    private static BackgroundLock = false; //prevents running multiple background task instances
    /* Does background task work, can be even called before Backend.Init() */
    /* Is run for ALL background tasks (both sync and notification) */
    public static async RunBackgroundTask(taskId: string, isHeadless: boolean): Promise<void> {
        const log = this.log.context('BackgroundTask:' + parseInt((Math.random() * 100).toString()));
        log.info(`Gained control over backgroundTask, id:${taskId}, isHeadless:${isHeadless}`);
        if (AppState.currentState != 'background') {
            log.info(`App is not in background (state = ${AppState.currentState}), exiting background task.`);
            return;
        }
        
        // lock mechanism
        log.debug('Waiting for random amount of time..');
        if (this.BackgroundLock) {
            log.warn('Another background task already running, exiting now..');
            return;
        }
        this.BackgroundLock = true;
        log.info('BackgroundLock locked.');
        try {
            await this.Init();
            if (this.UserSettings.DisableBackgroundTasks) {
                log.info('DisableBackgroundTasks enabled, exiting...');
                return;
            }
            if (!this.UserSettings.EnableBackgroundSync && !this.UserSettings.EnableNotifications) {
                log.info('BackgroundSync and notifications disabled.');
            } else {
                try {
                    if (this.UserSettings.EnableBackgroundSync) {
                        log.debug('BackgroundSync is enabled, checking cache...');
                        const cache = await this.GetArticleCache();
                        const cacheAgeMinutes = (Date.now() - parseInt(cache.timestamp.toString())) / 60000;
                        if (cacheAgeMinutes >= this.UserSettings.ArticleCacheTime * 0.75) {
                            log.info('Cache will expire soon, invalidating cache to force re-sync...');
                            cache.timestamp = 0;
                            await FSStore.setItem('cache',JSON.stringify(cache));
                        }
                    }
                    const arts = await this.GetArticles('feed');
                    if (this.UserSettings.EnableNotifications) {
                        const notifcache = await this.StorageGet('notifications-cache');
                        const lastNotificationBeforeMins = (Date.now() - parseInt(notifcache.timestamp.toString())) / 60000;
                        if (lastNotificationBeforeMins >= this.UserSettings.NewArticlesNotificationPeriod) {
                            notifcache.timestamp = Date.now();
                            let art: Article | null = null;
                            for (let i = 0; i < arts.length; i++) {
                                if (notifcache.seen_urls.indexOf(arts[i].url) < 0) {
                                    art = arts[i];
                                    notifcache.seen_urls.push(art.url);
                                    notifcache.seen_urls.splice(0, notifcache.seen_urls.length - 20); //keep only last 20
                                    break;
                                }
                            }
                            if (art == null)
                                log.context('Notifications').warn('No available article to show.');
                            else {
                                if(!await this.SendNotification(art.title, 'new_articles'))
                                    throw new Error('Failed to send notification.');
                            }
                            await this.StorageSave('notifications-cache', notifcache);
                        } else
                            log.info(`Will not show notification, time remaining: ${this.UserSettings.NewArticlesNotificationPeriod - lastNotificationBeforeMins} mins.`);
                    } else
                        log.info('Notifications disabled.');
                } catch (err) {
                    log.error(`Exception on backgroundTask, id:${taskId}, error:`, err);
                }
            }
            if (this.UserSettings.EnableAutomaticBackups) {
                const remainingTime = Date.now() - this.UserSettings.LastBackupTimestamp - (this.UserSettings.AutomaticBackupPeriod * 60 * 60 * 1000);
                if (remainingTime >= 0) {
                    const logB = log.context('AutoBackup');
                    logB.info('Creating auto-backup now..');
                    const dir = JSON.parse(this.UserSettings.AutomaticBackupDir);
                    if ((await ScopedStorage.getPersistedUriPermissions()).indexOf(dir.url) >= 0) {
                        logB.error(`Access to ${dir.url} is not in persisted permissions list.`);
                    } else {
                        logB.debug(`Auto-backup dir: ${this.UserSettings.AutomaticBackupDir}`);
                        const backupStr = await this.CreateBackup();
                        try {
                            const files = await ScopedStorage.listFiles(dir.uri);
                            files.sort((a, b) => {
                                if (a.name == 'NuntiBackup-latest.json')
                                    return 1;
                                else if (b.name == 'NuntiBackup-latest.json')
                                    return -1;
                                return a.uri < b.uri ? 1 : -1;
                            });
                            for (let i = 0; i < files.length; i++) {
                                const f = files[i];
                                if (f.name == 'NuntiBackup-latest.json')
                                    await ScopedStorage.rename(f.uri, 'NuntiBackup-1.json');
                                else if (f.name == 'NuntiBackup-1.json')
                                    await ScopedStorage.rename(f.uri, 'NuntiBackup-2.json');
                                else if (f.name == 'NuntiBackup-2.json')
                                    await ScopedStorage.rename(f.uri, 'NuntiBackup-3.json');
                                else if (f.name == 'NuntiBackup-3.json')
                                    await ScopedStorage.deleteFile(f.uri);
                            }
                            
                            logB.debug('writing now');
                            if (await ScopedStorage.writeFile(dir.uri, backupStr, 'NuntiBackup-latest.json', 'application/json', 'utf8') == null) {
                                throw new Error('Write to NuntiBackup-latest.json failed.');
                            }
                        } catch (err) {
                            logB.error('AutoBackup failed!', err);
                        }
                    }
                    this.UserSettings.LastBackupTimestamp = Date.now();
                    this.UserSettings.Save();
                } else
                    log.info(`Remaining time until next auto-backup: ${-(remainingTime / (60*60*1000)).toFixed(2)} hrs.`);
            }
        } finally {
            log.info('Unlocking BackgroundLock now.');
            this.BackgroundLock = false;
        }
    }
    

}