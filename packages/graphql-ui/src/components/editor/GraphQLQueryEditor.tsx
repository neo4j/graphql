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

import { useEffect, useRef, useState } from "react";
import { GraphQLSchema } from "graphql";
import { CodeMirror } from "../../utils/utils";
import { EditorFromTextArea } from "codemirror";
import { EDITOR_QUERY_INPUT } from "src/constants";
import { formatCode, ParserOptions } from "./utils";

export interface Props {
    schema: GraphQLSchema;
    query: string;
    mirrorRef: React.MutableRefObject<EditorFromTextArea | null>;
    initialQueryValue?: string;
    executeQuery: (override?: string) => Promise<void>;
    onChangeQuery: (query: string) => void;
}

export const GraphQLQueryEditor = ({
    schema,
    initialQueryValue,
    mirrorRef,
    query,
    executeQuery,
    onChangeQuery,
}: Props) => {
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);
    const ref = useRef<HTMLTextAreaElement | null>(null);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

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
            theme: "dracula",
            keyMap: "sublime",
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            lineWrapping: true,
            foldGutter: {
                // @ts-ignore
                minFoldSize: 4,
            },
            lint: {
                // @ts-ignore
                schema: schema,
                validationRules: null,
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
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Cmd-Space": showHint,
                "Ctrl-Space": showHint,
                "Alt-Space": showHint,
                "Shift-Space": showHint,
                "Shift-Alt-Space": showHint,
                "Cmd-Enter": () => {
                    executeQuery(mirror.getValue());
                },
                "Ctrl-Enter": () => {
                    executeQuery(mirror.getValue());
                },
                "Ctrl-L": () => {
                    formatCode(mirror, ParserOptions.GRAPH_QL);
                },
            },
        });
        setMirror(mirror);
        mirrorRef.current = mirror;

        if (initialQueryValue && ref.current) {
            mirror.setValue(initialQueryValue);
            ref.current.value = initialQueryValue;
        }

        mirror.on("change", (e) => {
            onChangeQuery(e.getValue());
        });
    }, [ref, schema]);

    useEffect(() => {
        const cursor = mirror?.getCursor();
        mirror?.setValue(query);
        if (cursor) mirror?.setCursor(cursor);
    }, [query]);

    useEffect(() => {
        // @ts-ignore
        document[EDITOR_QUERY_INPUT] = mirror;
    }, [mirror]);

    return <textarea ref={ref} className="w-full h-full" />;
};
