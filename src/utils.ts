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

// return a context
function getCursorContext():
    | { editor: undefined; range: undefined; text: undefined; }
    | { editor: vscode.TextEditor; range: vscode.Range; text: string; } {
    const editor = vscode.window.activeTextEditor;
    console.log("editor: " + editor);
    if (editor === undefined) {
        return { editor: undefined, range: undefined, text: undefined };
    }
    const document = editor.document;
    const selection = editor.selection;
    console.log("selection: " + selection);
    let range = undefined;
    if (selection.isEmpty) {
        console.log("active: " + selection.active);
        range = document.getWordRangeAtPosition(selection.active, /\S+/)!;
    }

    range = range ? range : new vscode.Range(selection.start, selection.end);

    const text = document.getText(range)!;
    return { editor, range, text };
}

export async function pasteLink(
) {
    const { editor, range, text } = getCursorContext();
    if (editor === undefined) {
        return;
    }
    const url = await vscode.env.clipboard.readText().then((r: string) => r.trim());
    console.log("text: " + text);
    console.log("clipboard: " + url);
    console.log("range: " + range);
    const checkedText = text.trim();
    if (checkedText === '') {
        editor.edit((e) => { e.replace(range, url); });
        return;
    }
    const mdUrl = "[" + checkedText + "](" + url + ")";
    const len = mdUrl.length - checkedText.length;
    editor.edit((e) => {
        e.replace(range, mdUrl);
    });
    // get the end of the current selection
    let pos = editor.selection.end;
    // add one to leave the new string one space away
    pos = new vscode.Position(pos.line, pos.character + len + 1);
    editor.selection = new vscode.Selection(pos, pos);
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