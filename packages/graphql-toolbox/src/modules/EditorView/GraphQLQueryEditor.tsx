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

import type { EditorFromTextArea } from "codemirror";
import type { GraphQLSchema } from "graphql";
import { useContext, useEffect, useRef, useState } from "react";
import { Extension, FileName } from "../../components/Filename";
import { EDITOR_QUERY_INPUT, THEME_EDITOR_DARK, THEME_EDITOR_LIGHT } from "../../constants";
import { AppSettingsContext } from "../../contexts/appsettings";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import { CodeMirror } from "../../utils/utils";
import { ParserOptions, formatCode, handleEditorDisableState } from "./utils";

export interface Props {
    schema: GraphQLSchema;
    loading: boolean;
    buttons: any;
    mirrorRef: React.MutableRefObject<EditorFromTextArea | null>;
    executeQuery: (override?: string) => Promise<void>;
}

export const GraphQLQueryEditor = ({ schema, mirrorRef, loading, buttons, executeQuery }: Props) => {
    const store = useStore();
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
            let newValue = event.getValue();
            if (newValue === "") {
                newValue = " ";
            }
            console.log(useStore.getState().activeTabIndex);
            store.updateQuery(newValue, useStore.getState().activeTabIndex);
        });
    }, [ref, schema]);

    useEffect(() => {
        if (store.activeTab?.query) {
            const cursor = mirror?.getCursor();
            mirror?.setValue(store.activeTab.query);
            if (cursor) mirror?.setCursor(cursor);
        }
    }, [store.activeTab?.query]);

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
            <textarea id={EDITOR_QUERY_INPUT} ref={ref} />
        </div>
    );
};
