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
import { lintGutter, lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { Annotation, EditorState, Prec, StateEffect } from "@codemirror/state";
import type { ViewUpdate } from "@codemirror/view";
import { drawSelection, dropCursor, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { tokens } from "@neo4j-ndl/base";
import { Button, IconButton } from "@neo4j-ndl/react";
import { PlayIconOutline } from "@neo4j-ndl/react/icons";
import classNames from "classnames";
import { graphql as graphqlExtension } from "cm6-graphql";
import type { EditorView as CodeMirrorEditorView } from "codemirror";
import { EditorView } from "codemirror";
import type { GraphQLSchema } from "graphql";
import { dracula, tomorrow } from "thememirror";

import { Extension, FileName } from "../../components/Filename";
import { EDITOR_QUERY_INPUT } from "../../constants";
import { AppSettingsContext } from "../../contexts/appsettings";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import { formatCode, handleEditorDisableState, ParserOptions } from "./utils";

export interface Props {
    loading: boolean;
    onSubmit: (override?: string) => Promise<void>;
    schema: GraphQLSchema;
}

const External = Annotation.define<boolean>();

export const QueryEditor = ({ loading, onSubmit, schema }: Props) => {
    const store = useStore();
    const theme = useContext(ThemeContext);
    const appSettings = useContext(AppSettingsContext);
    const elementRef = useRef<HTMLDivElement | null>(null);
    const [value, setValue] = useState<string>();
    const [editorView, setEditorView] = useState<CodeMirrorEditorView | null>(null);

    const formatTheCode = (): void => {
        if (!editorView) return;
        formatCode(editorView, ParserOptions.GRAPH_QL);
    };

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
                    key: "Mod-m",
                    run: (view) => {
                        formatCode(view, ParserOptions.GRAPH_QL);
                        return true;
                    },
                    preventDefault: true,
                },
            ])
        ),
        foldGutter({
            closedText: "▶",
            openText: "▼",
        }),
        graphqlExtension(schema),
        theme.theme === Theme.LIGHT ? tomorrow : dracula,
        appSettings.showLintMarkers ? lintGutter() : [],
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
    }, [theme.theme, appSettings.showLintMarkers, extensions]);

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
        <div className="w-full h-full relative rounded-b-xl">
            <FileName
                name={"query"}
                extension={Extension.GRAPHQL}
                rightButtons={
                    <>
                        <Button
                            aria-label="Prettify code"
                            className={classNames(
                                "mr-2",
                                theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark"
                            )}
                            color="neutral"
                            fill="outlined"
                            size="small"
                            onClick={formatTheCode}
                            disabled={loading}
                        >
                            Prettify
                        </Button>
                        <IconButton
                            data-test-editor-query-button
                            aria-label="Execute query"
                            style={{ height: "1.7rem" }}
                            className={classNames(theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark")}
                            color="primary"
                            clean
                            // eslint-disable-next-line @typescript-eslint/no-misused-promises
                            onClick={() => onSubmit()}
                            disabled={!schema || loading}
                        >
                            <PlayIconOutline
                                style={{
                                    color: tokens.colors.primary[50],
                                }}
                            />
                        </IconButton>
                    </>
                }
                borderRadiusTop={false}
            />
            <div
                id={EDITOR_QUERY_INPUT}
                ref={elementRef}
                className={classNames(
                    "w-full h-[calc(100%-3rem)] absolute",
                    theme.theme === Theme.LIGHT ? "cm-light" : "cm-dark"
                )}
            />
        </div>
    );
};
