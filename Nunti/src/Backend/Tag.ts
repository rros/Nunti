export class Tag {
    public static lastRemoved: Tag | null = null;
    public name: string;

    private feedUrlsAffected: string[] | null = null; //used rarely only for undo function
    
    constructor(name: string) {
        if (name.trim() == '')
            throw new Error('Tag must contain non-whitespace characters.');
        this.name = name;
    }
    
    public static async New(name: string): Promise<Tag> {
        let contains = false;
        Backend.UserSettings.Tags.forEach((tag) => {
            if (tag.name == name)
                contains = true;
        });
        if (!contains) {
            const tag = new Tag(name);
            Backend.UserSettings.Tags.push(tag);
            await Backend.UserSettings.Save();
            return tag;
        } else
            throw new Error(`Tag ${name} already exists.`);
    }

    public static async NewOrExisting(name: string): Promise<Tag> {
        let found: Tag | null = null;
        Backend.UserSettings.Tags.forEach((tag) => {
            if (tag.name == name)
                found = tag;
        });
        if (found === null) {
            return Tag.New(name);
        } else
            return found;
    }

    public static async Remove(tag: Tag): Promise<void> {
        let i = -1;
        for (let y = 0; y < Backend.UserSettings.Tags.length; y++) {
            if (Backend.UserSettings.Tags[y].name == tag.name)
                i = y;
        }
        if (i < 0)
            Log.BE.context('Tag:'+tag.name).context('Remove').error('Cannot remove tag from UserSettings.');
        else
            Backend.UserSettings.Tags.splice(i, 1);
        
        tag.feedUrlsAffected = [];
        Backend.UserSettings.FeedList.forEach((feed: Feed) => {
            let feed_tag_index = -1;
            for (let y = 0; y < feed.tags.length; y++) {
                if (feed.tags[i].name == tag.name)
                    feed_tag_index = y;
            }
            if (feed_tag_index >= 0) {
                if (tag.feedUrlsAffected == null)
                    tag.feedUrlsAffected = [];
                tag.feedUrlsAffected.push(feed.url);
                feed.tags.splice(feed_tag_index, 1);
            }
        });
        Tag.lastRemoved = tag;
        Backend.UserSettings.Save();
    }

    public static async UndoRemove(): Promise<boolean> {
        if (this.lastRemoved == null)
            return false;
        const tag = this.lastRemoved;
        const feedsAffected = tag.feedUrlsAffected;
        tag.feedUrlsAffected = null;
        Backend.UserSettings.Tags.push(tag);
        if (feedsAffected != null) {
            feedsAffected.forEach( (url: string) => {
                const feedList = Backend.UserSettings.FeedList;
                feedList[Backend.FindFeedByUrl(url, feedList)].tags.push(tag);
            });
        }
        this.lastRemoved = null;
        await Backend.UserSettings.Save();
        return true;
    }
}