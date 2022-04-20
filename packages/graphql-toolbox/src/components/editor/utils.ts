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
import prettier from "prettier/standalone";
import prettierBabel from "prettier/parser-babel";
import parserGraphQL from "prettier/parser-graphql";

export enum ParserOptions {
    GRAPH_QL,
    JSON,
}

export const formatCode = (mirror: EditorFromTextArea, parserOption: ParserOptions): void => {
    const cursor = mirror.getCursor();
    const value = mirror.getValue();

    let options = {};
    switch (parserOption) {
        case ParserOptions.GRAPH_QL:
            options = {
                parser: "graphql",
                plugins: [parserGraphQL],
            };
            break;
        case ParserOptions.JSON:
            options = {
                parser: "json",
                plugins: [prettierBabel],
                endOfLine: "auto",
                printWidth: 60,
            };
            break;
        default:
            options = {
                parser: "graphql",
                plugins: [parserGraphQL],
            };
            break;
    }

    const formatted = prettier.format(value, options) as unknown as string;
    mirror.setValue(formatted);
    if (cursor) mirror.setCursor(cursor);
};

export const handleEditorDisableState = (mirror: EditorFromTextArea | null, loading: boolean) => {
    const wrapperElement = mirror?.getWrapperElement();

    if (loading) {
        wrapperElement?.classList.add("code-mirror-disabled-state");
    } else {
        wrapperElement?.classList.remove("code-mirror-disabled-state");
    }
};

export const safeParse = (str: string | null | undefined, fallback: Record<string, any>): Record<string, any> => {
    if (!str) return fallback;
    try {
        return JSON.parse(str);
    } catch (e) {
        return fallback;
    }
};
