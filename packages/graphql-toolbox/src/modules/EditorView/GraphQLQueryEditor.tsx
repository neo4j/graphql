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
import { GraphQLSchema } from "graphql";
import { EditorFromTextArea } from "codemirror";
import { CodeMirror } from "../../utils/utils";
import { EDITOR_QUERY_INPUT, THEME_EDITOR_DARK, THEME_EDITOR_LIGHT } from "../../constants";
import { formatCode, handleEditorDisableState, ParserOptions } from "./utils";
import { Extension, FileName } from "../../components/Filename";
import { ThemeContext, Theme } from "../../contexts/theme";
import { AppSettingsContext } from "../../contexts/appsettings";

export interface Props {
    schema: GraphQLSchema;
    query: string;
    loading: boolean;
    buttons: any;
    mirrorRef: React.MutableRefObject<EditorFromTextArea | null>;
    executeQuery: (override?: string) => Promise<void>;
    onChangeQuery: (query: string) => void;
}

export const GraphQLQueryEditor = ({
    schema,
    mirrorRef,
    query,
    loading,
    buttons,
    executeQuery,
    onChangeQuery,
}: Props) => {
    const theme = useContext(ThemeContext);
    const appsettings = useContext(AppSettingsContext);
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);
    const ref = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

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
                // @ts-ignore - GraphQL Adds this one
                minFoldSize: 4,
            },
            lint: {
                // @ts-ignore - Mismatch of types, can be ignored
                schema: schema,
                validationRules: [],
            },
            hintOptions: {
                schema: schema,
                closeOnUnfocus: false,
                completeSingle: false,
                container: element.parentElement,
            },
            info: {
                schema: schema,
            },
            jump: {
                schema: schema,
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
                "Cmd-Enter": () => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    executeQuery(mirror.getValue());
                },
                "Ctrl-Enter": () => {
                    // eslint-disable-next-line @typescript-eslint/no-floating-promises
                    executeQuery(mirror.getValue());
                },
                "Ctrl-L": () => {
                    formatCode(mirror, ParserOptions.GRAPH_QL);
                },
            },
        });
        setMirror(mirror);
        mirrorRef.current = mirror;

        mirror.on("change", (event: any) => {
            onChangeQuery(event.getValue());
        });
    }, [ref, schema]);

    useEffect(() => {
        const cursor = mirror?.getCursor();
        mirror?.setValue(query);
        if (cursor) mirror?.setCursor(cursor);
    }, [query]);

    useEffect(() => {
        handleEditorDisableState(mirror, loading);
    }, [loading]);

    useEffect(() => {
        // @ts-ignore - Find a better solution
        document[EDITOR_QUERY_INPUT] = mirror;
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
            <FileName name={"query"} extension={Extension.GRAPHQL} buttons={buttons}></FileName>
            <textarea id={EDITOR_QUERY_INPUT} ref={ref} className="w-full h-full" />
        </div>
    );
};
