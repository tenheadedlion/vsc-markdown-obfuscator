import { v4 as uuidv4 } from 'uuid';
import * as vscode from 'vscode';

export function isExternalUrl(path: string): boolean {
    // Get this regex from:
    //	- https://mathiasbynens.be/demo/url-regex
    //  - https://gist.github.com/dperini/729294
    var reWeburl = new RegExp(
        "^" +
        // protocol identifier (optional)
        // short syntax // still required
        "(?:(?:(?:https?|ftp):)?\\/\\/)" +
        // user:pass BasicAuth (optional)
        "(?:\\S+(?::\\S*)?@)?" +
        "(?:" +
        // IP address exclusion
        // private & local networks
        "(?!(?:10|127)(?:\\.\\d{1,3}){3})" +
        "(?!(?:169\\.254|192\\.168)(?:\\.\\d{1,3}){2})" +
        "(?!172\\.(?:1[6-9]|2\\d|3[0-1])(?:\\.\\d{1,3}){2})" +
        // IP address dotted notation octets
        // excludes loopback network 0.0.0.0
        // excludes reserved space >= 224.0.0.0
        // excludes network & broadcast addresses
        // (first & last IP address of each class)
        "(?:[1-9]\\d?|1\\d\\d|2[01]\\d|22[0-3])" +
        "(?:\\.(?:1?\\d{1,2}|2[0-4]\\d|25[0-5])){2}" +
        "(?:\\.(?:[1-9]\\d?|1\\d\\d|2[0-4]\\d|25[0-4]))" +
        "|" +
        // host & domain names, may end with dot
        // can be replaced by a shortest alternative
        // (?![-_])(?:[-\\w\\u00a1-\\uffff]{0,63}[^-_]\\.)+
        "(?:" +
        "(?:" +
        "[a-z0-9\\u00a1-\\uffff]" +
        "[a-z0-9\\u00a1-\\uffff_-]{0,62}" +
        ")?" +
        "[a-z0-9\\u00a1-\\uffff]\\." +
        ")+" +
        // TLD identifier name, may end with dot
        "(?:[a-z\\u00a1-\\uffff]{2,}\\.?)" +
        ")" +
        // port number (optional)
        "(?::\\d{2,5})?" +
        // resource path (optional)
        "(?:[/?#]\\S*)?" +
        "$", "i"
    );
    return path.match(reWeburl) !== null;
}

export function randomString(): string {
    return uuidv4();
}

export function composeMdImage(alt: string, url: string): string {
    return "![" + alt + "](" + url + ")";
}

export function isPunctuation(s: string): boolean {
    let puns = String.raw`.,?!'\";:-`;
    let arr = s.split('');

    for (let i = 0; i < arr.length; ++i) {
        if (puns.includes(arr[i])) {
            return true;
        }
    }
    return false;
}

export function breakMdImage(line: string): [string, string] | undefined {
    const imgpat = /!\[(.*)\]\((.*)\)/;
    const m = line.match(imgpat);
    if (m) {
        return [m[1], m[2]];
    }
    return undefined;
}

export function getLink(
    documentParam?: vscode.TextDocument
): { alt: string, link: string } {
    const document = documentParam || vscode.window.activeTextEditor?.document;

    if (!document || (document && document.languageId !== "markdown")) {
        return { alt: '', link: '' };
    }

    const active = vscode.window.activeTextEditor!.selection.active;
    const range = document.getWordRangeAtPosition(
        active,
        /\[\[.*\]\]/
    );

    if (!range || (range && range.isEmpty)) {
        return { alt: '', link: '' };
    }

    return splitAltAndLink(document.getText(range));
};

function splitAltAndLink(input: string)
    : {
        alt: string,
        link: string
    } {
    const regex = /^\[\[(?:(?=.+\|)(.+)\|(.+)|(.+))\]\]$/;
    const m = regex.exec(input);
    if (m === null) {
        return { alt: '', link: '' };
    }

    if (m[1] === undefined) {
        return { alt: '', link: m[3] };
    } else {
        return { alt: m[1], link: m[2] };
    }

}