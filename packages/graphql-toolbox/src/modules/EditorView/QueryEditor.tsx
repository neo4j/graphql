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

import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Annotation, EditorState, Prec, StateEffect } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import {
    drawSelection,
    dropCursor,
    highlightActiveLine,
    highlightSpecialChars,
    keymap,
    lineNumbers,
} from "@codemirror/view";
import { graphql as graphqlExtension } from "cm6-graphql";
import { EditorView } from "codemirror";
import type { GraphQLSchema } from "graphql";
import { dracula, tomorrow } from "thememirror";

import { Extension, FileName } from "../../components/Filename";
import { EDITOR_QUERY_INPUT } from "../../constants";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import { formatCode, handleEditorDisableState, ParserOptions } from "./utils";

export interface Props {
    loading: boolean;
    buttons: any;
    editorView: EditorView | null;
    setEditorView: React.Dispatch<React.SetStateAction<EditorView | null>>;
    onSubmit: (override?: string) => Promise<void>;
    schema: GraphQLSchema;
}

const External = Annotation.define<boolean>();

export const QueryEditor = ({ loading, buttons, editorView, setEditorView, onSubmit, schema }: Props) => {
    const theme = useContext(ThemeContext);
    const store = useStore();
    const elementRef = useRef<HTMLDivElement | null>(null);
    const [value, setValue] = useState<string>();

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
            store.updateQuery(value, useStore.getState().activeTabIndex);
        }
    });

    const extensions = [
        lineNumbers(),
        highlightSpecialChars(),
        highlightActiveLine(),
        bracketMatching(),
        closeBrackets(),
        history(),
        dropCursor(),
        drawSelection(),
        indentOnInput(),
        autocompletion({ defaultKeymap: true, maxRenderedOptions: 5 }),
        highlightSelectionMatches(),
        EditorView.lineWrapping,
        keymap.of([
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
        ]),
        Prec.highest(
            keymap.of([
                {
                    key: "Mod-Enter",
                    run: (view) => {
                        onSubmit(view.state.doc.toString()).catch(() => null);
                        return true;
                    },
                },
                {
                    key: "Shift-Mod-L",
                    run: (view) => {
                        formatCode(view, ParserOptions.GRAPH_QL);
                        return true;
                    },
                },
            ])
        ),
        foldGutter({
            closedText: "▶",
            openText: "▼",
        }),
        graphqlExtension(schema),
        theme.theme === Theme.LIGHT ? tomorrow : dracula,
        updateListener,
    ];

    useEffect(() => {
        if (elementRef.current === null) {
            return;
        }

        const state = EditorState.create({
            doc: "",
            extensions,
        });

        const view = new EditorView({
            state,
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
        if (value === undefined) {
            return;
        }
        const currentValue = editorView ? editorView.state.doc.toString() : "";
        if (editorView && value !== currentValue) {
            editorView.dispatch({
                changes: { from: 0, to: currentValue.length, insert: value || "" },
                annotations: [External.of(true)],
            });
        }
    }, [value, editorView]);

    useEffect(() => {
        setValue(useStore.getState().getActiveTab().query);
    }, [useStore.getState().getActiveTab().query]);

    useEffect(() => {
        handleEditorDisableState(elementRef.current, loading);
    }, [loading]);

    return (
        <div className="rounded-b-xl" style={{ width: "100%", height: "100%" }}>
            <FileName
                name={"query"}
                extension={Extension.GRAPHQL}
                rightButtons={buttons}
                borderRadiusTop={false}
            ></FileName>
            <div
                id={EDITOR_QUERY_INPUT}
                className={theme.theme === Theme.LIGHT ? "cm-light" : "cm-dark"}
                ref={elementRef}
            />
        </div>
    );
};
