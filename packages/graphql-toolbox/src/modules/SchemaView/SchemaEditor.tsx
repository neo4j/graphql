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

import { useContext, useEffect, useState } from "react";

import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput, syntaxTree } from "@codemirror/language";
import type { Diagnostic } from "@codemirror/lint";
import { linter, lintGutter, lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, Prec, StateEffect } from "@codemirror/state";
import { drawSelection, dropCursor, EditorView, highlightSpecialChars, keymap, lineNumbers } from "@codemirror/view";
import { Button, IconButton, Tip } from "@neo4j-ndl/react";
import { StarIconOutline } from "@neo4j-ndl/react/icons";
import classNames from "classnames";
import { graphql } from "cm6-graphql";
import { dracula, tomorrow } from "thememirror";

import { Extension, FileName } from "../../components/Filename";
import { DEFAULT_TYPE_DEFS, SCHEMA_EDITOR_INPUT } from "../../constants";
import { AppSettingsContext } from "../../contexts/appsettings";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import { handleEditorDisableState } from "../EditorView/utils";
import { getSchemaForLintAndAutocompletion, getUnsupportedDirective } from "./utils";

function unsupportedDirectivesLinter(view: EditorView) {
    const diagnostics: Diagnostic[] = [];
    const doc = view.state.doc;

    syntaxTree(view.state)
        .cursor()
        .iterate((node) => {
            if (node.name === "Directive") {
                const directiveName = doc.sliceString(node.from, node.to);
                const unsupportedDirective = getUnsupportedDirective(directiveName);
                if (unsupportedDirective) {
                    diagnostics.push({
                        from: node.from,
                        to: node.to,
                        severity: "error",
                        message: `The ${unsupportedDirective} directive is not currently supported by the GraphQL Toolbox.`,
                    });
                }
            }
        });
    return diagnostics;
}

export interface Props {
    loading: boolean;
    isIntrospecting: boolean;
    elementRef: React.MutableRefObject<HTMLDivElement | null>;
    formatTheCode: () => void;
    introspect: () => Promise<void>;
    saveAsFavorite: () => void;
    onSubmit: () => void;
    setEditorView: React.Dispatch<React.SetStateAction<EditorView | null>>;
    editorView: EditorView | null;
}

export const SchemaEditor = ({
    loading,
    isIntrospecting,
    elementRef,
    formatTheCode,
    introspect,
    saveAsFavorite,
    onSubmit,
    setEditorView,
    editorView,
}: Props) => {
    const theme = useContext(ThemeContext);
    const appSettings = useContext(AppSettingsContext);
    const storedTypeDefs = useStore.getState().typeDefinitions || DEFAULT_TYPE_DEFS;
    const [building, setBuilding] = useState<boolean>(false);

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
                    key: "Mod-m",
                    run: () => {
                        formatTheCode();
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
        linter(unsupportedDirectivesLinter),
        graphql(getSchemaForLintAndAutocompletion()),
        theme.theme === Theme.LIGHT ? tomorrow : dracula,
        appSettings.showLintMarkers ? lintGutter() : [],
    ];

    useEffect(() => {
        if (elementRef.current === null) {
            return;
        }

        const state = EditorState.create({
            doc: storedTypeDefs,
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
        handleEditorDisableState(elementRef.current, loading);
    }, [loading]);

    return (
        <div className="w-full h-full relative rounded-b-xl">
            <FileName
                extension={Extension.GRAPHQL}
                name="type-definitions"
                rightButtons={
                    <Button
                        data-test-schema-editor-build-button
                        aria-label="Build schema"
                        className={classNames(theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark")}
                        color="primary"
                        fill="filled"
                        size="small"
                        onClick={() => {
                            setBuilding(true);
                            setTimeout(() => {
                                onSubmit();
                                setBuilding(false);
                            }, 0);
                        }}
                        disabled={loading}
                        loading={building}
                    >
                        Build schema
                    </Button>
                }
                leftButtons={
                    <>
                        <Tip allowedPlacements={["bottom"]}>
                            <Button
                                data-test-schema-editor-introspect-button
                                aria-label="Generate type definitions"
                                className={classNames(
                                    "mr-2",
                                    theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark"
                                )}
                                color="primary"
                                fill="outlined"
                                size="small"
                                // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                onClick={introspect}
                                disabled={loading}
                                loading={isIntrospecting}
                            >
                                <Tip.Trigger>Introspect</Tip.Trigger>
                            </Button>
                            <Tip.Content style={{ width: "19rem" }}>
                                This will overwrite your current type definitions!
                            </Tip.Content>
                        </Tip>

                        <Button
                            data-test-schema-editor-prettify-button
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

                        <Tip allowedPlacements={["bottom"]}>
                            <Tip.Trigger>
                                <IconButton
                                    data-test-schema-editor-favourite-button
                                    aria-label="Save as favorite"
                                    style={{ height: "1.7rem" }}
                                    className={classNames(
                                        theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark"
                                    )}
                                    size="small"
                                    color="neutral"
                                    onClick={saveAsFavorite}
                                    disabled={loading}
                                >
                                    <StarIconOutline />
                                </IconButton>
                            </Tip.Trigger>
                            <Tip.Content>Save as Favorite</Tip.Content>
                        </Tip>
                    </>
                }
            ></FileName>
            <div
                id={SCHEMA_EDITOR_INPUT}
                ref={elementRef}
                className={classNames("w-full h-full absolute", theme.theme === Theme.LIGHT ? "cm-light" : "cm-dark")}
            ></div>
        </div>
    );
};
