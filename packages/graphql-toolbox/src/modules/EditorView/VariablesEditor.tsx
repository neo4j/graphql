/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { useContext, useEffect, useRef, useState } from "react";

import { closeBrackets } from "@codemirror/autocomplete";
import { indentWithTab } from "@codemirror/commands";
import { javascript } from "@codemirror/lang-javascript";
import { bracketMatching, foldGutter, indentOnInput } from "@codemirror/language";
import { Annotation, StateEffect } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import {
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightSpecialChars,
    keymap,
    lineNumbers,
} from "@codemirror/view";
import { dracula, tomorrow } from "thememirror";

import type { Extension } from "../../components/Filename";
import { FileName } from "../../components/Filename";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import { handleEditorDisableState } from "./utils";

export interface Props {
    id: string;
    loading: boolean;
    fileName: string;
    value: string;
    fileExtension: Extension;
    borderRadiusTop?: boolean;
}

const External = Annotation.define<boolean>();

export const VariablesEditor = ({ id, loading, fileExtension, fileName, value, borderRadiusTop }: Props) => {
    const theme = useContext(ThemeContext);
    const store = useStore();
    const elementRef = useRef<HTMLDivElement | null>(null);
    const [editorView, setEditorView] = useState<EditorView | null>(null);

    // Taken from https://github.com/uiwjs/react-codemirror/blob/master/core/src/useCodeMirror.ts
    const updateListener = EditorView.updateListener.of((vu: ViewUpdate) => {
        if (
            vu.docChanged &&
            // Fix echoing of the remote changes:
            // If transaction is marked as remote we don't have to call `onChange` handler again
            !vu.transactions.some((tr) => tr.annotation(External))
        ) {
            const doc = vu.state.doc;
            const value = doc.toString();
            store.updateVariables(value, useStore.getState().activeTabIndex);
        }
    });

    const extensions = [
        lineNumbers(),
        highlightSpecialChars(),
        highlightActiveLine(),
        bracketMatching(),
        closeBrackets(),
        drawSelection(),
        indentOnInput(),
        dropCursor(),
        foldGutter({
            closedText: "▶",
            openText: "▼",
        }),
        javascript(),
        EditorView.lineWrapping,
        keymap.of([indentWithTab]),
        theme.theme === Theme.LIGHT ? tomorrow : dracula,
        updateListener,
    ];

    useEffect(() => {
        if (elementRef.current === null) {
            return;
        }

        const view = new EditorView({
            doc: value,
            extensions: [],
            parent: elementRef.current,
        });

        setEditorView(view);

        return () => {
            view.destroy();
            setEditorView(null);
        };
    }, [elementRef.current]);

    useEffect(() => {
        if (editorView) {
            editorView.dispatch({ effects: StateEffect.reconfigure.of(extensions) });
        }
    }, [theme.theme, extensions]);

    useEffect(() => {
        if (!editorView) return;
        const selection = editorView.state.selection;
        editorView.dispatch({
            changes: { from: 0, to: editorView.state.doc.length, insert: value },
            selection: value.length > selection.mainIndex ? undefined : selection,
        });
    }, [value]);

    useEffect(() => {
        handleEditorDisableState(elementRef.current, loading);
    }, [loading]);

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <FileName extension={fileExtension} name={fileName} borderRadiusTop={borderRadiusTop}></FileName>
            <div id={id} className={theme.theme === Theme.LIGHT ? "cm-light" : "cm-dark"} ref={elementRef} />
        </div>
    );
};
