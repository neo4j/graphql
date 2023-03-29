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

import { Fragment, useContext, useEffect, useRef, useState } from "react";
import type { EditorFromTextArea } from "codemirror";
import { Button, IconButton } from "@neo4j-ndl/react";
import { StarIconOutline } from "@neo4j-ndl/react/icons";
import { tokens } from "@neo4j-ndl/base";
import { CodeMirror } from "../../utils/utils";
import { DEFAULT_TYPE_DEFS, SCHEMA_EDITOR_INPUT, THEME_EDITOR_DARK, THEME_EDITOR_LIGHT } from "../../constants";
import { formatCode, handleEditorDisableState, ParserOptions } from "../EditorView/utils";
import { getSchemaForLintAndAutocompletion } from "./utils";
import { Extension, FileName } from "../../components/Filename";
import { ThemeContext, Theme } from "../../contexts/theme";
import { AppSettingsContext } from "../../contexts/appsettings";
import { ProTooltip } from "../../components/ProTooltip";
import { useStore } from "../../store";

export interface Props {
    loading: boolean;
    isIntrospecting: boolean;
    mirrorRef: React.MutableRefObject<EditorFromTextArea | null>;
    formatTheCode: () => void;
    introspect: () => Promise<void>;
    saveAsFavorite: () => void;
}

export const SchemaEditor = ({
    loading,
    isIntrospecting,
    mirrorRef,
    formatTheCode,
    introspect,
    saveAsFavorite,
}: Props) => {
    const theme = useContext(ThemeContext);
    const appsettings = useContext(AppSettingsContext);
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        const schemaForLintAndAutocompletion = getSchemaForLintAndAutocompletion();

        const element = ref.current;

        const showHint = () => {
            mirror.showHint({
                completeSingle: true,
                container: element.parentElement,
            });
        };

        const mirror = CodeMirror.fromTextArea(ref.current, {
            lineNumbers: true,
            tabSize: 2,
            mode: "graphql",
            theme: theme.theme === Theme.LIGHT ? THEME_EDITOR_LIGHT : THEME_EDITOR_DARK,
            keyMap: "sublime",
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            lineWrapping: true,
            foldGutter: {
                // @ts-ignore - Added By GraphQL Plugin
                minFoldSize: 4,
            },
            lint: {
                // @ts-ignore - Mismatch of types, can be ignored
                schema: schemaForLintAndAutocompletion,
                validationRules: [],
            },
            hintOptions: {
                schema: schemaForLintAndAutocompletion,
                closeOnUnfocus: true,
                completeSingle: false,
                container: element.parentElement,
            },
            info: {
                schema: schemaForLintAndAutocompletion,
            },
            jump: {
                schema: schemaForLintAndAutocompletion,
            },
            gutters: [
                "CodeMirror-linenumbers",
                "CodeMirror-foldgutter",
                appsettings.showLintMarkers ? "CodeMirror-lint-markers" : "",
            ],
            extraKeys: {
                "Cmd-Space": showHint,
                "Ctrl-Space": showHint,
                "Alt-Space": showHint,
                "Shift-Space": showHint,
                "Shift-Alt-Space": showHint,
                "Ctrl-L": () => {
                    if (!mirror) return;
                    formatCode(mirror, ParserOptions.GRAPH_QL);
                },
            },
        });
        setMirror(mirror);
        mirrorRef.current = mirror;

        const storedTypeDefs = useStore((store) => store.typeDefinitions) || DEFAULT_TYPE_DEFS;
        if (storedTypeDefs && ref.current) {
            mirror?.setValue(storedTypeDefs);
            ref.current.value = storedTypeDefs;
        }

        mirror.on("change", (e) => {
            if (ref.current) {
                ref.current.value = e.getValue();
            }
        });
    }, [ref]);

    useEffect(() => {
        handleEditorDisableState(mirror, loading);
    }, [loading]);

    useEffect(() => {
        // @ts-ignore - Find a better solution
        document[SCHEMA_EDITOR_INPUT] = mirror;
    }, [mirror]);

    useEffect(() => {
        const t = theme.theme === Theme.LIGHT ? THEME_EDITOR_LIGHT : THEME_EDITOR_DARK;
        mirror?.setOption("theme", t);
    }, [theme.theme]);

    useEffect(() => {
        const nextGutters = [
            "CodeMirror-linenumbers",
            "CodeMirror-foldgutter",
            appsettings.showLintMarkers ? "CodeMirror-lint-markers" : "",
        ];
        mirror?.setOption("gutters", nextGutters);
    }, [appsettings.showLintMarkers]);

    return (
        <div className="rounded-b-xl" style={{ width: "100%", height: "100%" }}>
            <FileName
                extension={Extension.GRAPHQL}
                name="type-definitions"
                buttons={
                    <Fragment>
                        <ProTooltip
                            tooltipText="This will overwrite your current type definitions!"
                            width={300}
                            left={-99}
                            top={39}
                        >
                            <Button
                                data-test-schema-editor-introspect-button
                                aria-label="Generate type definitions"
                                className="mr-2"
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
                        </ProTooltip>

                        <Button
                            data-test-schema-editor-prettify-button
                            aria-label="Prettify code"
                            className="mr-2"
                            color="neutral"
                            fill="outlined"
                            size="small"
                            onClick={formatTheCode}
                            disabled={loading}
                        >
                            Prettify
                        </Button>

                        <ProTooltip
                            tooltipText="Save as Favorite"
                            arrowPositionOverride="top-right"
                            width={120}
                            left={-71}
                            top={42}
                        >
                            <IconButton
                                data-test-schema-editor-favourite-button
                                aria-label="Save as favorite"
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
                        </ProTooltip>
                    </Fragment>
                }
            ></FileName>
            <textarea id={SCHEMA_EDITOR_INPUT} ref={ref} style={{ width: "100%", height: "100%" }} />
        </div>
    );
};
