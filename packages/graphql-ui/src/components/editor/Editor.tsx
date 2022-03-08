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

import { useCallback, useState } from "react";
import { graphql, GraphQLSchema } from "graphql";
import GraphiQLExplorer from "graphiql-explorer";
import styled from "styled-components";
import { Button } from "@neo4j-ndl/react";
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

const Pains = styled.div`
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    flex-grow: 1;
    width: 100%;
    height: 100%;
`;

const Wrapper = styled.div``;

const Header = styled.div`
    display: flex;
    justify-content: flex-start;
    padding: 1.2em 0;
`;

const Pain = styled.div`
    padding: 10px;
    flex-grow: 1;
    width: 100%;
    height: 85vh;
`;

const DEFAULT_QUERY = `
# Type queries into this side of the screen, and you will 
# see intelligent typeaheads aware of the current GraphQL type schema.

query {

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

    const getInitialQueryValue = (): string | undefined =>
        JSON.parse(localStorage.getItem(LOCAL_STATE_TYPE_LAST_QUERY) as string) || DEFAULT_QUERY;

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

    return (
        <Wrapper className="p-5">
            <Header>
                <Button id={EDITOR_QUERY_BUTTON} fill="outlined" onClick={() => onSubmit()} disabled={!props.schema}>
                    Query (CTRL+ENTER)
                </Button>

                <Button fill="outlined" onClick={() => {}} disabled={false}>
                    Prettify
                </Button>

                <Button fill="outlined" onClick={() => isShowExplorer(!showExplorer)} disabled={false}>
                    Explorer
                </Button>

                <Button fill="outlined" onClick={() => isShowDocs(!showDocs)} disabled={false}>
                    Docs
                </Button>

                {loading && (
                    <div style={{ padding: "0.5em" }}>
                        <h1>Loading</h1>
                    </div>
                )}
            </Header>
            <Pains>
                {/* <Pain>
                    <div className="h-full">
                        <div className="h-3/4 pb-5">
                            {props.schema ? (
                                <GraphQLQueryEditor
                                    schema={props.schema}
                                    initialQueryValue={getInitialQueryValue()}
                                    setQuery={setQuery}
                                    onChangeQuery={(query) =>
                                        localStorage.setItem(LOCAL_STATE_TYPE_LAST_QUERY, JSON.stringify(query))
                                    }
                                    query={onSubmit}
                                ></GraphQLQueryEditor>
                            ) : null}
                        </div>
                        <div className="h-1/4">
                            <JSONEditor readonly={false} onChange={setVariableValues}></JSONEditor>
                        </div>
                    </div>
                </Pain>
                <Pain>
                    <ResizableBox
                        className=""
                        width={200}
                        height={200}
                        // handle={<span className="custom-handle custom-handle-se" />}
                        handleSize={[8, 8]}
                    >
                        <div className="h-full">
                            <JSONEditor readonly={true} json={output}></JSONEditor>
                        </div>
                    </ResizableBox>
                </Pain> */}
                <Frame
                    queryEditor={
                        props.schema ? (
                            <GraphQLQueryEditor
                                schema={props.schema}
                                query={query}
                                initialQueryValue={getInitialQueryValue()}
                                onChangeQuery={(query) => {
                                    setQuery(query);
                                    localStorage.setItem(LOCAL_STATE_TYPE_LAST_QUERY, JSON.stringify(query));
                                }}
                                executeQuery={onSubmit}
                            />
                        ) : null
                    }
                    parameterEditor={
                        <JSONEditor id={EDITOR_PARAMS_INPUT} readonly={false} onChange={setVariableValues} />
                    }
                    resultView={<JSONEditor id={EDITOR_RESPONSE_OUTPUT} readonly={true} json={output} />}
                    showExplorer={showExplorer}
                    explorer={
                        <GraphiQLExplorer
                            schema={props.schema}
                            query={query}
                            onEdit={setQuery}
                            onRunOperation={onSubmit}
                            explorerIsOpen={showExplorer}
                            // getDefaultScalarArgValue={getDefaultScalarArgValue}
                            // makeDefaultArg={makeDefaultArg}
                            colors={{
                                keyword: "#B11A04",
                                // OperationName, FragmentName
                                def: "#D2054E",
                                // FieldName
                                property: "#1F61A0",
                                // FieldAlias
                                qualifier: "#1C92A9",
                                // ArgumentName and ObjectFieldName
                                attribute: "#8B2BB9",
                                number: "#2882F9",
                                string: "#D64292",
                                // Boolean
                                builtin: "#D47509",
                                // Enum
                                string2: "#0B7FC7",
                                variable: "#397D13",
                                // Type
                                atom: "#CA9800",
                            }}
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
            </Pains>
        </Wrapper>
    );
};
