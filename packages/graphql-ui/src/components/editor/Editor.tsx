import { useCallback, useState } from "react";
import { graphql, GraphQLSchema } from "graphql";
import GraphiQLExplorer from "graphiql-explorer";
import styled from "styled-components";
import { Button } from "@neo4j-ndl/react";
import { JSONEditor } from "./JSONEditor";
import { GraphQLQueryEditor } from "./GraphQLQueryEditor";
import { LOCAL_STATE_TYPE_LAST_QUERY } from "src/constants/constants";
import { Frame } from "./Frame";

const Pains = styled.div`
    display: flex;
    justify-content: flex-start;
    flex-direction: row;
    flex-grow: 1;
    width: 100%;
    height: 100%;
`;

const Wrapper = styled.div`
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: stretch;
    width: 100%;
    overflow-y: auto;
`;

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
                <Button fill="outlined" onClick={() => onSubmit()} disabled={!props.schema}>
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
                    parameterEditor={<JSONEditor readonly={false} onChange={setVariableValues} />}
                    resultView={<JSONEditor readonly={true} json={output} />}
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
                />
            </Pains>
        </Wrapper>
    );
};
