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
import { CodeMirror } from "../../utils/utils";

export interface Props {
    id: string;
    json?: string;
    readonly?: boolean;
    onChange?: (json: string) => void;
}

export const JSONEditor = (props: Props) => {
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const mirror = useRef<CodeMirror.Editor | null>(null);
    const [input, setInput] = useState("");

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        mirror.current = CodeMirror.fromTextArea(ref.current, {
            mode: { name: "javascript", json: true },
            theme: "dracula",
            readOnly: props.readonly,
            lineNumbers: true,
            lineWrapping: true,
            tabSize: 2,
            keyMap: "sublime",
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            foldGutter: {
                // @ts-ignore
                minFoldSize: 4,
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
        });

        document[props.id] = mirror.current;

        mirror.current.on("change", (e) => {
            setInput(e.getValue());
        });
    }, []);

    useEffect(() => {
        if (props.json && mirror.current) {
            mirror.current.setValue(JSON.stringify(JSON.parse(props.json || "{}"), null, 2));
        }
    }, [props.json]);

    useEffect(() => {
        if (!props.readonly && props.onChange) {
            props.onChange(input);
        }
    }, [input, props.onChange]);

    useEffect(() => {
        return () => {
            mirror.current = null;
        };
    }, []);

    return <textarea id={props.id} style={{ width: "100%", height: "100%" }} ref={ref} />;
};
