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
import { EditorFromTextArea } from "codemirror";
import { CodeMirror } from "../../utils/utils";
import {
    DEFAULT_TYPE_DEFS,
    LOCAL_STATE_TYPE_DEFS,
    SCHEMA_EDITOR_INPUT,
    THEME_EDITOR_DARK,
    THEME_EDITOR_LIGHT,
} from "../../constants";
import { formatCode, handleEditorDisableState, ParserOptions } from "../EditorView/utils";
import { getSchemaForLintAndAutocompletion } from "./utils";
import { Extension, FileName } from "../../components/Filename";
import { ThemeContext, Theme } from "../../contexts/theme";
import { Storage } from "../../utils/storage";
import { AppSettingsContext } from "../../contexts/appsettings";

export interface Props {
    loading: boolean;
    mirrorRef: React.MutableRefObject<EditorFromTextArea | null>;
}

export const SchemaEditor = ({ loading, mirrorRef }: Props) => {
    const theme = useContext(ThemeContext);
    const appsettings = useContext(AppSettingsContext);
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        const schemaForLintAndAutocompletion = getSchemaForLintAndAutocompletion();

        const element = ref.current as HTMLTextAreaElement;

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
                // @ts-ignore
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

        const storedTypeDefs = Storage.retrieveJSON(LOCAL_STATE_TYPE_DEFS) || DEFAULT_TYPE_DEFS;
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
            <FileName extension={Extension.GRAPHQL} name="type-definitions"></FileName>
            <textarea id={SCHEMA_EDITOR_INPUT} ref={ref} style={{ width: "100%", height: "100%" }} />
        </div>
    );
};
