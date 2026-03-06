# Trilium Typst Preview

Typst Preview is a Trilium widget to preview Typst document. It

* uses [typst.ts](https://github.com/Myriad-Dreamin/typst.ts) to compile the Typst document
* supports include input from sub notes

<img width="1920" height="1128" alt="image" src="https://github.com/user-attachments/assets/9d80f2b9-e8c7-4a10-ad62-306d8ec25382" />

Installation

Go to the repository, and follow the steps below:

copy the content of `widget.js` to a JSX code note in Trilium and add the label `#widget` to the note

copy the content of `widget.css` to a CSS code note and add the lable `#appCss` to the note

## Usage

To preview a single Typst note:

1. create a code note (unfortunately there is no `Typst` syntax highlighting)
2. add the label `#typstPreview` to the note
3. reopen the note, then you will be able to see the preview

To include a sub note (image, or other text (code) notes):

1. create a sub note (or import an image note)
2. add the label `#filename=…` to that note. For example, `#filename=glacier.jpg`
3. In the note with `#typstPreview`, you can refer it using `/glacier.jpg`

The notes that are allowed to be included should always have `#filename` label; otherwise, it will be ignored or be treated as a directory.
