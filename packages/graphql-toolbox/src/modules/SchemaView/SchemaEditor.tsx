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

import { useContext, useEffect, useRef } from "react";

import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, Prec, StateEffect } from "@codemirror/state";
import {
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightSpecialChars,
    keymap,
    lineNumbers,
} from "@codemirror/view";
import { tokens } from "@neo4j-ndl/base";
import { Button, IconButton, SmartTooltip } from "@neo4j-ndl/react";
import { StarIconOutline } from "@neo4j-ndl/react/icons";
import classNames from "classnames";
import { graphql } from "cm6-graphql";
import { dracula, tomorrow } from "thememirror";

import { Extension, FileName } from "../../components/Filename";
import { DEFAULT_TYPE_DEFS, SCHEMA_EDITOR_INPUT } from "../../constants";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import { handleEditorDisableState } from "../EditorView/utils";
import { getSchemaForLintAndAutocompletion } from "./utils";

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
    const favoritesTooltipRef = useRef<HTMLButtonElement | null>(null);
    const introspectionTooltipRef = useRef<HTMLButtonElement | null>(null);
    const storedTypeDefs = useStore.getState().typeDefinitions || DEFAULT_TYPE_DEFS;

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
        graphql(getSchemaForLintAndAutocompletion()),
        theme.theme === Theme.LIGHT ? tomorrow : dracula,
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
    }, [theme.theme, extensions]);

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
                        style={{ backgroundColor: tokens.colors.primary[50] }}
                        className={classNames(theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark")}
                        color="primary"
                        fill="filled"
                        size="small"
                        onClick={onSubmit}
                        disabled={loading}
                    >
                        Build schema
                    </Button>
                }
                leftButtons={
                    <>
                        <Button
                            data-test-schema-editor-introspect-button
                            ref={introspectionTooltipRef}
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
                            Introspect
                        </Button>
                        <SmartTooltip
                            allowedPlacements={["bottom"]}
                            style={{ width: "19rem" }}
                            ref={introspectionTooltipRef}
                        >
                            {"This will overwrite your current type definitions!"}
                        </SmartTooltip>

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

                        <IconButton
                            data-test-schema-editor-favourite-button
                            ref={favoritesTooltipRef}
                            aria-label="Save as favorite"
                            style={{ height: "1.7rem" }}
                            className={classNames(theme.theme === Theme.LIGHT ? "ndl-theme-light" : "ndl-theme-dark")}
                            size="small"
                            color="neutral"
                            onClick={saveAsFavorite}
                            disabled={loading}
                        >
                            <StarIconOutline
                                style={{
                                    color: tokens.colors.neutral[80],
                                }}
                            />
                        </IconButton>
                        <SmartTooltip
                            allowedPlacements={["bottom"]}
                            style={{ width: "8rem" }}
                            ref={favoritesTooltipRef}
                        >
                            {"Save as Favorite"}
                        </SmartTooltip>
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
