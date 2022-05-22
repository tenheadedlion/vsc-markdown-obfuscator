# VSCode Markdown Toolkit

A set of non general-purpose markdown tools for personal use, they are developed to solve particular problems, but if you find them interesting or have an new idea about a new feature, you are welcome to join the project.

## Obfuscate Markdowm Images

Remove images' footprints by renaming and removing exif and gps information

Usage:

1. Install the extension.
2. Select code which contains the images to be obfuscated. Or select nothing, the extension will take it that all images in current file are selected.
3. right click, choose the command "Obfuscate Markdowm Images", and observe file changes.

## Sort Markdown Excerpt List

The idea comes from my daily note-taking routine, I copy a sentense from somewhere and highlight one keyword by wrapping it with `**`, this can be done easily with `Ctrl + B`,  then I want this keyword to appear in the head of the sentense, followed by the original sentense.

For example:

```
to take or publish extracts from (something, such as a book)
```

After `Ctrl + B`

```
to take or publish **extracts** from (something, such as a book)
```

After Processing:

```
_**extracts**_: to take or publish extracts from (something, such as a book)
```

and these list entries are sorted by keyword.
