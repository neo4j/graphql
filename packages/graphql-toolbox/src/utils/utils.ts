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

import { useEffect, useRef } from "react";
import CodeMirror from "codemirror";
import "codemirror/addon/hint/show-hint";
import "codemirror/addon/comment/comment";
import "codemirror/addon/edit/matchbrackets";
import "codemirror/addon/edit/closebrackets";
import "codemirror/addon/fold/foldgutter";
import "codemirror/addon/fold/brace-fold";
import "codemirror/addon/search/search";
import "codemirror/addon/search/searchcursor";
import "codemirror/addon/search/jump-to-line";
import "codemirror/addon/dialog/dialog";
import "codemirror/addon/lint/lint";
import "codemirror/mode/javascript/javascript";
import "codemirror/keymap/sublime";
import "codemirror-graphql/hint";
import "codemirror-graphql/lint";
import "codemirror-graphql/info";
import "codemirror-graphql/jump";
import "codemirror-graphql/mode";
import "codemirror/addon/lint/lint.css";
import "codemirror/theme/dracula.css";
import "codemirror/theme/neo.css";
import "codemirror/lib/codemirror.css";
import "codemirror/addon/hint/show-hint.css";

// @ts-ignore - Needed for the tests
document.CodeMirror = CodeMirror;

export { CodeMirror };

export const getURLProtocolFromText = (text: string | null | undefined): string => {
    if (!text) return "";
    try {
        return new URL(text)?.protocol;
    } catch (_) {
        return "";
    }
};

export const usePrevious = (
    value: string | number | boolean | null | undefined,
): string | number | boolean | null | undefined => {
    const ref = useRef();
    useEffect(() => {
        // @ts-ignore - React.MutableRefObject has no typing
        ref.current = value;
    });
    return ref.current;
};
