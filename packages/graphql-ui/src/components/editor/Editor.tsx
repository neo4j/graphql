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

import { useCallback, useState, useRef, useEffect } from "react";
import { graphql, GraphQLSchema } from "graphql";
import GraphiQLExplorer from "graphiql-explorer";
import { Button } from "@neo4j-ndl/react";
import { EditorFromTextArea } from "codemirror";
import { JSONEditor } from "./JSONEditor";
import { GraphQLQueryEditor } from "./GraphQLQueryEditor";
import {
    EDITOR_PARAMS_INPUT,
    EDITOR_QUERY_BUTTON,
    EDITOR_RESPONSE_OUTPUT,
    LOCAL_STATE_TYPE_LAST_QUERY,
} from "../../constants";
import { Frame } from "./Frame";
import { DocExplorer } from "./docexplorer/index";
import { formatCode, ParserOptions } from "./utils";
import { Extension } from "./Filename";

const DEFAULT_QUERY = `
    # Type queries into this side of the screen, and you will 
    # see intelligent typeaheads aware of the current GraphQL type schema.
    # Try the Explorer and use the Documentation

    query {
        __typename
    }
`;

export interface Props {
    schema?: GraphQLSchema;
}

export const Editor = (props: Props) => {
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [variableValues, setVariableValues] = useState("");
    const [output, setOutput] = useState("");
    const [showExplorer, isShowExplorer] = useState(false);
    const [showDocs, isShowDocs] = useState(false);
    const refForQueryEditorMirror = useRef<EditorFromTextArea | null>(null);

    const formatTheCode = (): void => {
        if (!refForQueryEditorMirror.current) return;
        formatCode(refForQueryEditorMirror.current, ParserOptions.GRAPH_QL);
    };

    const onSubmit = useCallback(
        async (override?: string) => {
            let result: string;
            setLoading(true);
            if (!props.schema) return;

            try {
                const response = await graphql({
                    schema: props.schema,
                    source: override || query || "",
                    contextValue: {},
                    ...(variableValues ? { variableValues: JSON.parse(variableValues) } : {}),
                });

                result = JSON.stringify(response);
            } catch (error) {
                result = JSON.stringify({ errors: [error] });
            }

            setTimeout(() => {
                setOutput(result);
                setLoading(false);
            }, 500);
        },
        [query, setOutput, setLoading, variableValues]
    );

    useEffect(() => {
        const initQuery = JSON.parse(localStorage.getItem(LOCAL_STATE_TYPE_LAST_QUERY) as string) || DEFAULT_QUERY;
        setQuery(initQuery);
    }, []);

    return (
        <div>
            <div className="p-3 bg-draculaDark grid grid-cols-4 gap-4" style={{ width: "1200px" }}>
                <Button
                    id={EDITOR_QUERY_BUTTON}
                    fill="outlined"
                    onClick={() => onSubmit()}
                    disabled={!props.schema || loading}
                >
                    {!loading ? "Query (CTRL+ENTER)" : "Loading..."}
                </Button>
                <Button fill="outlined" onClick={formatTheCode} disabled={loading}>
                    {!loading ? "Prettify (CTRL+L)" : "Loading..."}
                </Button>
                <Button fill="outlined" onClick={() => isShowExplorer(!showExplorer)} disabled={loading}>
                    {!loading ? "Explorer" : "Loading..."}
                </Button>
                <Button fill="outlined" onClick={() => isShowDocs(!showDocs)} disabled={loading}>
                    {!loading ? "Docs" : "Loading..."}
                </Button>
            </div>
            <div className="flex justify-start flex-row flex-grow w-full h-full mt-3">
                <Frame
                    queryEditor={
                        props.schema ? (
                            <GraphQLQueryEditor
                                schema={props.schema}
                                query={query}
                                mirrorRef={refForQueryEditorMirror}
                                onChangeQuery={(query) => {
                                    setQuery(query);
                                    localStorage.setItem(LOCAL_STATE_TYPE_LAST_QUERY, JSON.stringify(query));
                                }}
                                executeQuery={onSubmit}
                            />
                        ) : null
                    }
                    parameterEditor={
                        <JSONEditor
                            id={EDITOR_PARAMS_INPUT}
                            fileName="params"
                            fileExtension={Extension.JSON}
                            readonly={false}
                            onChange={setVariableValues}
                        />
                    }
                    resultView={
                        <JSONEditor
                            id={EDITOR_RESPONSE_OUTPUT}
                            fileName="response"
                            fileExtension={Extension.JSON}
                            readonly={true}
                            json={output}
                            onChange={setOutput}
                        />
                    }
                    showExplorer={showExplorer}
                    explorer={
                        <GraphiQLExplorer
                            schema={props.schema}
                            query={query}
                            onEdit={setQuery}
                            onRunOperation={onSubmit}
                            onToggleExplorer={() => isShowExplorer(!showExplorer)}
                            explorerIsOpen={showExplorer}
                        />
                    }
                    showDocs={showDocs}
                    documentation={
                        <DocExplorer schema={props.schema}>
                            <button
                                className="docExplorerHide"
                                onClick={() => isShowDocs(!showDocs)}
                                aria-label="Close Documentation Explorer"
                            >
                                {"\u2715"}
                            </button>
                        </DocExplorer>
                    }
                />
            </div>
        </div>
    );
};
