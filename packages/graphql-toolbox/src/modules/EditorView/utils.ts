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

import type { EditorView } from "@codemirror/view";
import type { GraphQLSchema } from "graphql";
import { parse } from "graphql";
import { getComplexity, simpleEstimator } from "graphql-query-complexity";
import pluginBabel from "prettier/plugins/babel";
import pluginEstree from "prettier/plugins/estree.mjs"; // Explicitly import .mjs file
import pluginGraphQL from "prettier/plugins/graphql";
import prettier from "prettier/standalone";

export enum ParserOptions {
    GRAPH_QL,
    JSON,
}

export const formatCode = (editorView: EditorView, parserOption: ParserOptions): void => {
    const selection = editorView.state.selection;
    // eslint-disable-next-line @typescript-eslint/no-base-to-string
    const value = editorView.state.doc.toString();

    let options = {};
    switch (parserOption) {
        case ParserOptions.JSON:
            options = {
                parser: "json",
                plugins: [pluginBabel, pluginEstree],
                endOfLine: "auto",
                printWidth: 60,
            };
            break;
        case ParserOptions.GRAPH_QL:
        default:
            options = {
                parser: "graphql",
                plugins: [pluginGraphQL],
            };
            break;
    }

    prettier
        .format(value, options)
        .then((formatted) => {
            editorView.dispatch({
                changes: { from: 0, to: editorView.state.doc.length, insert: formatted },
                selection: selection.main.to > formatted.length ? undefined : selection,
            });
        })
        .catch(() => {}); // Explicitly ignore errors (on error we simply don't format)
};

export const handleEditorDisableState = (editorViewRef: HTMLDivElement | null, loading: boolean): void => {
    if (!editorViewRef) return;

    if (loading) {
        editorViewRef?.classList.add("code-mirror-disabled-state");
    } else {
        editorViewRef?.classList.remove("code-mirror-disabled-state");
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

export const calculateQueryComplexity = (schema: GraphQLSchema, query: string, variables: string): number => {
    try {
        const complexity = getComplexity({
            estimators: [simpleEstimator({ defaultComplexity: 1 })],
            schema,
            query: parse(query),
            variables: safeParse(variables, {}),
        });

        console.log("Query complexity: ", complexity);
        return complexity;
    } catch (error) {
        console.log("Query complexity calculation failed");
        return -1;
    }
};
