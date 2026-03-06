import { defineWidget, RightPanelWidget } from "trilium:preact";
import { useActiveNoteContext, useNoteProperty } from "trilium:preact";
import { useEffect, useRef, useState } from "trilium:preact";

import { ActionButton, RawHtmlBlock } from "trilium:preact";

import { $typst } from "typst.js";

function addSubFiles_(note, path) {
    if (note.getLabelValue("filename")) {
        const filename = note.getLabelValue("filename");
        const filepath = "/" + [...path, filename].join("/");

        if (note.type === "text" || note.type === "code") {
            return note.getContent()
            .then(content => {
                $typst.addSource(filepath, content);
                api.log(`added ${filepath} as source`);
            });
        } else if (note.type === "image") {
            return fetch(`/api/images/${note.noteId}/${filename}`)
            .then(response => {
                if (!response.ok) {
                    api.log(`Failed to fetch: ${response.statusText}`);
                }
                return response.arrayBuffer();
            })
            .then(arrayBuffer => {
                api.log(`added ${filepath} as binary`);
                return $typst.mapShadow(filepath, new Uint8Array(arrayBuffer));
            });
        } else {
            throw new Error(`unsupported note ${note.noteId} with type ${note.type}`);
        }
    } else if (note.getChildNoteIds().length > 0) {
        return note.getChildNotes()
        .then(notes => Promise.all(
                notes.map(note => addSubFiles_(note, [...path, note.title]))
            )
        );
    }
}

function addSubFiles(note) {
    return note.getChildNotes()
    .then(notes =>
        Promise.all(
            notes.map(note => addSubFiles_(note, []))
        )
    )
}

async function compileNote(note, setVectorData) {
    addSubFiles(note)
    .then(() => note.getContent())
    .then(mainContent => $typst.vector({ mainContent }))
    .then(vectorData => setVectorData(vectorData))
    .then(() => $typst.resetShadow())
    .catch(error => console.log(error));
}

function downloadPdf(vectorData, note) {
    addSubFiles(note)
    .then(() => note.getContent())
    .then(mainContent => $typst.pdf({ mainContent }))
    .then(pdfData => {
        console.log("Preparing PDF...");
        const blob = new Blob([pdfData], { type: "application/pdf" });

        console.log("Creating link...");
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);

        a.download = `${note.title}.pdf`;
        console.log("Emulating click...");
        a.click();
        URL.revokeObjectURL(a.href);
    })
    .then(() => $typst.resetShadow())
    .catch(error => console.log(error));
}

export default defineWidget({
    parent: "right-pane",
    render: () => {
        const { note } = useActiveNoteContext();
        const noteTitle = useNoteProperty(note, "title");

        if (!note ||
            !note.hasLabel("typstPreview") ||
            note.type !== "code")
            return;

        const [vectorData, setVectorData] = useState(null);
        const [svgData, setSvgData] = useState('');
        const [resetCounter, setResetCounter] = useState(0);

        const compileDocument = () => {
            compileNote(note, setVectorData)
        };

        useEffect(() => {
            if (vectorData) {
                $typst.svg({ vectorData })
                .then(svgData => setSvgData(svgData))
            }
        }, [vectorData])

        const refreshPreview = (e) => {
            e.stopPropagation();
            setResetCounter(prev => prev + 1);
            compileDocument();
        };

        useEffect(() => {
            compileDocument();
        }, [note]);

        // useEffect(() => {
        //     const interval = setInterval(compileDocument, 15000);
        //     return () => clearInterval(interval);
        // }, [resetCounter]);

        // context menu
        const contextMenu = [
            {
                title: "Download",
                uiIcon: "bx bx-download",
                handler: (item, e) => {
                    if (vectorData) {
                        downloadPdf(vectorData, note);
                    } else {
                        api.showMessage("Please compile the document first");
                    }
                }
            }
        ];

        return (
            <RightPanelWidget
                id="typst-preview"
                title="Typst Preview"
                buttons={[
                    <ActionButton icon="bx bx-refresh" text="Refresh" onClick={refreshPreview}/>
                ]}
                contextMenuItems={contextMenu}>
                    <div class="typst-preview-block" dangerouslySetInnerHTML={{ __html: svgData }}/>
            </RightPanelWidget>
        );
    }
});
