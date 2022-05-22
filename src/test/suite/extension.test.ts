import * as assert from 'assert';
import * as fs from 'fs';

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
import * as vscode from 'vscode';
import * as myExtension from '../../utils.js';
import * as ExcerptEngine from '../../excerpt-engine.js';
import * as markdown from '../../markdown';

suite('Extension Test Suite', () => {
	vscode.window.showInformationMessage('Start all tests.');

	test('Sample test', () => {
		assert.strictEqual(-1, [1, 2, 3].indexOf(5));
		assert.strictEqual(-1, [1, 2, 3].indexOf(0));
	});

	test('Break markdown image annotation test', () => {
		assert.strictEqual(myExtension.randomString().length, 36);
		const imgpat = "![alt text](some-url.png)";
		const t = myExtension.breakMdImage(imgpat);
		if (t !== undefined) {
			assert.strictEqual(t[0], "alt text");
			assert.strictEqual(t[1], "some-url.png");
		}
		assert.strictEqual(true, myExtension.isExternalUrl("https://www.google.com/logo.png"));
		assert.strictEqual(true, myExtension.isExternalUrl("https://www.google.com"));
		assert.strictEqual(false, myExtension.isExternalUrl("www.google.com"));
		assert.strictEqual(false, myExtension.isExternalUrl("www.google.com/logo.png"));
		assert.strictEqual(false, myExtension.isExternalUrl("logo.png"));

	});


	test("Engine", () => {
		assert.notStrictEqual(
			[
				[
					'**world**'
				],
				[
					'hello',
					'**world**',
					'then',
					',',
					'goodbye',
					'world'
				]
			]

			, ExcerptEngine.parse("hello **world** then, goodbye world"));
	});

	test("Markdown", () => {
		const r = markdown.parse(
			`
---
id: sjlrgxcj9e4kroz57w2iy2m
title: Web
desc: ''
updated: 1652539630576
created: 1652536578183
---

- 1
- 2

## Some Title

What is this?

- a
`

		);
		console.log(r);
	});
});
