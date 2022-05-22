import * as vscode from 'vscode';
import * as utils from './utils';
import * as excerpt from './excerpt-engine';
import * as markdown from './markdown';


export function activate(context: vscode.ExtensionContext) {
	const disposable = vscode.commands.registerCommand('extension.obfuscateImages', obfuscateImage);
	context.subscriptions.push(disposable);
	const sort = vscode.commands.registerCommand('extension.sortList', sortList);
	context.subscriptions.push(sort);
}

function getSelected(editor: vscode.TextEditor | undefined): [vscode.TextEditor, vscode.Range, string] | undefined {
	if (editor) {
		const document = editor.document;
		let selection: vscode.Range = editor.selection;
		let selectedAsString = document.getText(selection);
		if (selectedAsString) {
			console.log("selction: " + selectedAsString);
		} else {
			console.log("no selction, then select all");
			selectedAsString = document.getText();
			var firstln = editor.document.lineAt(0);
			var lastln = editor.document.lineAt(editor.document.lineCount - 1);
			selection = new vscode.Range(firstln.range.start, lastln.range.end);
		}
		return [editor, selection, selectedAsString];
	}
	return undefined;
}

function intoLines(text: string): [string[], string] {
	const lnbrkpat = /\r?\n/;
	let m = text.match(lnbrkpat);
	let lnbrk = m ? m[0] : "\n";

	const lines = text.split(lnbrk);
	return [lines, lnbrk];
}

function obfuscateImage() {
	let s = getSelected(vscode.window.activeTextEditor);
	if (s === undefined) {
		return;
	}
	let selectedText = s[2];
	let vscodeSelection = s[1];
	let editor = s[0];

	let newtxt = "";
	let r = intoLines(selectedText);
	if (r) {
		let lines = r[0];
		let lnbrk = r[1];

		for (let line of lines) {
			const r = utils.breakMdImage(line);
			if (r !== undefined) {
				console.log("found image: " + line);
				if (!utils.isExternalUrl(r[1])) {
					const newName = rename(r[1]);
					if (newName !== undefined) {
						line = utils.composeMdImage(r[0], newName);
					}
				}
			}
			newtxt = newtxt + line + lnbrk;
		}
		// the final line does not end with newline
		newtxt = newtxt.slice(0, -1 * lnbrk.length);
		editor.edit(editBuilder => {
			editBuilder.replace(vscodeSelection, newtxt);
		});
	}
}

export function recompose(selection: string): string {
	const blocks = markdown.parse(selection);
	let newMD = "";
	blocks.forEach((block: markdown.Block) => {
		if (block.type === markdown.BlockType.nonListBlock) {
			block.content.forEach(line => {
				newMD += line + '\n\n';
			});
			newMD += '\n';
		} else if(block.type === markdown.BlockType.frontmatter) {
			block.content.forEach(line => {
				newMD += line + '\n';
			});
			newMD += '\n';
		} else if (block.type === markdown.BlockType.listBlock) {
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
			lineArr.forEach(line => {
				newMD += line + '\n';
			}
			);
			newMD += '\n';
		} 
		newMD += '\n';
	});
	// fuck windows
	newMD = newMD.slice(0, -1);
	return newMD;
}

function sortList() {
	let s = getSelected(vscode.window.activeTextEditor);
	if (s) {
		let selectedText = s[2];
		let vscodeSelection = s[1];
		let editor = s[0];
		let newMD = recompose(selectedText);
		// the final line does not end with newline
		editor.edit(editBuilder => {
			editBuilder.replace(vscodeSelection, newMD);
		});
	}
}

import * as Path from 'path';
import { Exif } from 'exif-be-gone-ts/ExifBeGone';
import { stringify } from 'querystring';

function rename(path: string): string | undefined {
	let dir = Path.dirname(path);
	let ext = Path.extname(path);
	let newPath = Path.join(dir, utils.randomString() + ext);

	// VSCode does not support absolute-pathed pictures
	if (Path.isAbsolute(path)) {
		return undefined;
	}

	function absPath(path: string): vscode.Uri {
		let dir = vscode.workspace.workspaceFolders?.[0]?.uri ?? vscode.Uri.file("");
		return vscode.Uri.joinPath(dir, path);
	}

	let safeOldUri = absPath(decodeURIComponent(path));
	const newUri = absPath(newPath);

	let extLC = ext.toLocaleLowerCase();
	if (extLC === '.jpeg' || extLC === '.jpg' || extLC === 'tiff') {
		Exif.remove(safeOldUri.fsPath, newUri.fsPath);
		vscode.workspace.fs.delete(safeOldUri);
	} else {
		vscode.workspace.fs.rename(safeOldUri, newUri);
	}
	return newPath;
}


export function deactivate() { }
