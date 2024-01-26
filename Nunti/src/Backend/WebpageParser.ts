import SanitizeHtml from 'sanitize-html';
import { DOMParser } from 'linkedom';
import { Readability } from '@mozilla/readability';
import HtmlPurifyList from '../HtmlPurifyList';

export class ReadabilityArticle {
    title: string;
    content: string; 
    textContent: string; 
    length: number; 
    excerpt: string; 
    byline: string; 
    dir: string; 
    siteName: string; 
    lang: string;
}

export class WebpageParser {
    /** Extracts readable content from webpage, may throw errors */
    public static async ExtractContentAsync(url: string): Promise<ReadabilityArticle> {
        const response = await fetch(url);
        if (!response.ok)
            throw Error('HTTP Error: ' + response.statusText);

        const cleanHtml = SanitizeHtml(await response.text(), {
            allowedTags: HtmlPurifyList.tags,
            allowedAttributes: { '*': HtmlPurifyList.attributes }
        });
        const dom = new DOMParser().parseFromString(cleanHtml, 'text/html');

        // add base at base, readability expects it
        const baseElem = dom.createElement('base');
        baseElem.setAttribute('href', url);
        dom.head.appendChild(baseElem);

        const readable: ReadabilityArticle | null = new Readability(dom).parse();
        if (readable == null)
            throw Error('Readability engine extracted nothing.');
        return readable;
    }
}