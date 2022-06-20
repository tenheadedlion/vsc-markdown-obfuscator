import * as markdown from './markdown';
import * as excerpt from './excerpt-engine';
import * as vscode from 'vscode';
import * as utils from './utils';


export function sortListBlock(block: markdown.Block) {
    let lineArr: Array<string> = [];
    block.content.forEach(line => {
        if (line.startsWith('- _**')) {
            lineArr.push(line);
        } else {
            let content = line.substring(2);
            let res = excerpt.parse(content);
            console.log(res);
            if (res) {
                let keywords = res[0];
                let words = res[1];
                let recomp = "";
                if (keywords.length !== 1) {
                    vscode.window.showErrorMessage("Expect just one keyword: " + line);
                    return;
                }
                recomp = "- _" + keywords[0].toLowerCase() + "_: ";
                let isLastAWord = false;
                words.forEach((word: string) => {
                    if (word.startsWith("**")) {
                        let trimmed = word.substring(2, word.length - 2);
                        recomp += trimmed;
                        isLastAWord = true;
                    } else if (utils.isPunctuation(word)) {
                        if (isLastAWord) {
                            recomp = recomp.trimEnd();
                        }
                        recomp += word;
                        isLastAWord = false;
                    }
                    else {
                        recomp += word;
                        isLastAWord = true;
                    }
                    recomp += " ";
                });
                // remove the trailing space
                recomp = recomp.trimEnd();
                lineArr.push(recomp);
            }
        }

    });
    lineArr.sort();
    return lineArr;
}