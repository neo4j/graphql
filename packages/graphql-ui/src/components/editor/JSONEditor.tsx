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

import { EditorFromTextArea } from "codemirror";
import { useContext, useEffect, useRef } from "react";
import { THEME_EDITOR_DARK, THEME_EDITOR_LIGHT } from "src/constants";
import { CodeMirror } from "../../utils/utils";
import { Extension, FileName } from "./Filename";
import { formatCode, handleEditorDisableState, ParserOptions } from "./utils";
import * as TopBarContext from "../../contexts/topbar";
import { EditorThemes } from "../../contexts/topbar";

export interface Props {
    id: string;
    json?: string;
    loading: boolean;
    readonly?: boolean;
    fileName: string;
    fileExtension: Extension;
    onChange?: (json: string) => void;
}

export const JSONEditor = (props: Props) => {
    const topbar = useContext(TopBarContext.Context);
    const ref = useRef<HTMLTextAreaElement | null>(null);
    const mirror = useRef<CodeMirror.Editor | null>(null);

    useEffect(() => {
        if (!ref.current) {
            return;
        }

        mirror.current = CodeMirror.fromTextArea(ref.current, {
            mode: { name: "javascript", json: true },
            theme: topbar.editorTheme === EditorThemes.LIGHT ? THEME_EDITOR_LIGHT : THEME_EDITOR_DARK,
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

        if (!props.readonly) {
            mirror.current.on("change", (e) => {
                if (props.onChange) {
                    props.onChange(e.getValue() as string);
                }
            });
        }

        document[props.id] = mirror.current;
    }, []);

    useEffect(() => {
        if (mirror.current && props.json) {
            mirror.current.setValue(props.json as string);
            formatCode(mirror.current as EditorFromTextArea, ParserOptions.JSON);
        }
    }, [props.json]);

    useEffect(() => {
        handleEditorDisableState(mirror.current as EditorFromTextArea, props.loading);
    }, [props.loading]);

    useEffect(() => {
        const editorTheme = topbar.editorTheme === EditorThemes.LIGHT ? THEME_EDITOR_LIGHT : THEME_EDITOR_DARK;
        mirror.current?.setOption("theme", editorTheme);
    }, [topbar.editorTheme]);

    return (
        <div style={{ width: "100%", height: "100%" }}>
            <FileName extension={props.fileExtension} name={props.fileName}></FileName>
            <textarea id={props.id} style={{ width: "100%", height: "100%" }} ref={ref} />;
        </div>
    );
};
