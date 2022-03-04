import { graphql, GraphQLSchema } from "graphql";
import { useCallback, useState } from "react";
import styled from "styled-components";
import { JSONEditor } from "./JSONEditor";
import { GraphQLQueryEditor } from "./GraphQLQueryEditor";
import { Button } from "@neo4j-ndl/react";

const Pains = styled.div`
    display: flex;
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
`;

const Header = styled.div`
    display: flex;
    padding: 10px;
`;

const Pain = styled.div`
    padding: 10px;
    flex-grow: 1;
    width: 100%;
    height: 85vh;
`;

export interface Props {
    schema: GraphQLSchema;
}

export const Editor = (props: Props) => {
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [variableValues, setVariableValues] = useState("");
    const [output, setOutput] = useState("");

    const onSubmit = useCallback(
        async (override?: string) => {
            let result: string;
            setLoading(true);

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
                <Button
                    className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                    type="button"
                    onClick={() => onSubmit()}
                >
                    Query (CTRL+ENTER)
                </Button>

                {loading && (
                    <div style={{ padding: "0.5em" }}>
                        <h1>Loading</h1>
                    </div>
                )}
            </Header>
            <Pains>
                <Pain>
                    <div className="h-full">
                        <div className="h-3/4 pb-5">
                            <GraphQLQueryEditor
                                schema={props.schema}
                                setQuery={setQuery}
                                query={onSubmit}
                            ></GraphQLQueryEditor>
                        </div>
                        <div className="h-1/4">
                            <JSONEditor readonly={false} onChange={setVariableValues}></JSONEditor>
                        </div>
                    </div>
                </Pain>
                <Pain>
                    <div className="h-full">
                        <JSONEditor readonly={true} json={output}></JSONEditor>
                    </div>
                </Pain>
            </Pains>
        </Wrapper>
    );
};
