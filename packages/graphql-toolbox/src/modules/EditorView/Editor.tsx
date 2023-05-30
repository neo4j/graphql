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

import { useCallback, useContext, useEffect, useRef, useState } from "react";

import { tokens } from "@neo4j-ndl/base";
import { Button, IconButton, Switch } from "@neo4j-ndl/react";
import { PlayIconOutline } from "@neo4j-ndl/react/icons";
import type { EditorFromTextArea } from "codemirror";
import GraphiQLExplorer from "graphiql-explorer";
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";
import debounce from "lodash.debounce";

import { tracking } from "../../analytics/tracking";
import { Extension } from "../../components/Filename";
import { ViewSelectorComponent } from "../../components/ViewSelectorComponent";
import { DEFAULT_QUERY, EDITOR_PARAMS_INPUT, EDITOR_RESPONSE_OUTPUT } from "../../constants";
import { Screen } from "../../contexts/screen";
import { SettingsContext } from "../../contexts/settings";
import { useStore } from "../../store";
import { AppSettings } from "../AppSettings/AppSettings";
import { DocExplorerComponent } from "../HelpDrawer/DocExplorerComponent";
import { HelpDrawer } from "../HelpDrawer/HelpDrawer";
import { GraphQLQueryEditor } from "./GraphQLQueryEditor";
import { Grid } from "./grid/Grid";
import { JSONEditor } from "./JSONEditor";
import { calculateQueryComplexity, formatCode, ParserOptions, safeParse } from "./utils";

const DEBOUNCE_TIMEOUT = 500;

export interface Props {
    schema?: GraphQLSchema;
}

export const Editor = ({ schema }: Props) => {
    const settings = useContext(SettingsContext);
    const [initialLoad, setInitialLoad] = useState<boolean>(false);
    const [loading, setLoading] = useState<boolean>(false);
    const [query, setQuery] = useState<string>("");
    const [variableValues, setVariableValues] = useState<string>("");
    const [initVariableValues, setInitVariableValues] = useState<string>("");
    const [output, setOutput] = useState<string>("");
    const [showDocs, setShowDocs] = useState<boolean>(false);
    const refForQueryEditorMirror = useRef<EditorFromTextArea | null>(null);
    const showRightPanel = settings.isShowHelpDrawer || settings.isShowSettingsDrawer;

    const debouncedSave = useCallback(
        debounce((nextState) => {
            useStore.setState(nextState);
        }, DEBOUNCE_TIMEOUT),
        []
    );

    const formatTheCode = (): void => {
        if (!refForQueryEditorMirror.current) return;
        formatCode(refForQueryEditorMirror.current, ParserOptions.GRAPH_QL);
    };

    const handleShowDocs = () => {
        setShowDocs(!showDocs);
        tracking.trackOpenSchemaDocs({ screen: Screen.EDITOR, origin: "explorer", action: !showDocs });
    };

    const onSubmit = useCallback(
        async (override?: string) => {
            let result: string;

            setLoading(true);
            if (!schema) return;

            try {
                const response = await graphql({
                    schema: schema,
                    source: override || query || "",
                    contextValue: {},
                    variableValues: safeParse(variableValues, {}),
                });

                result = JSON.stringify(response);
            } catch (error) {
                result = JSON.stringify({ errors: [error] });
            }

            const complexity = calculateQueryComplexity(schema, override || query || "", variableValues);
            tracking.trackExecuteQuery({ screen: "query editor", queryComplexity: complexity });

            setTimeout(() => {
                setOutput(result);
                setLoading(false);
            }, 500);
        },
        [query, setOutput, setLoading, variableValues]
    );

    useEffect(() => {
        const initQuery = useStore.getState().lastQuery || DEFAULT_QUERY;
        const initParams = useStore.getState().lastParams || "";
        setInitialLoad(true);
        setQuery(initQuery);
        setVariableValues(initParams);
        setInitVariableValues(initParams);
    }, []);

    return (
        <div className="w-full h-full flex">
            <div className={`flex flex-col ${showRightPanel ? "w-content-container" : "w-full"}`}>
                <div className="h-12 w-full bg-white flex items-center px-6">
                    <div className="justify-start">
                        <ViewSelectorComponent
                            key="editor-view-selector"
                            elementKey="editor-view-selector"
                            isEditorDisabled={!!schema || loading}
                        />
                    </div>
                </div>

                <div className="w-full h-full flex">
                    <div className="h-full w-96 bg-white border-t border-gray-100">
                        <div className="h-content-docs-container p-6">
                            {schema && initialLoad ? (
                                <>
                                    <div className="flex justify-end">
                                        <Switch
                                            data-test-explorer-show-docs-switch
                                            label="Docs"
                                            checked={showDocs}
                                            onChange={handleShowDocs}
                                            content={undefined}
                                            rel={undefined}
                                            rev={undefined}
                                        />
                                    </div>
                                    <GraphiQLExplorer
                                        schema={schema}
                                        query={query}
                                        onEdit={setQuery}
                                        onRunOperation={onSubmit}
                                        explorerIsOpen={true}
                                        styles={{
                                            buttonStyle: {
                                                display: "block",
                                                fontWeight: "bold",
                                                backgroundColor: tokens.colors.neutral[40],
                                                margin: "5px 5px 5px 10px",
                                            },
                                            explorerActionsStyle: {
                                                margin: "4px -8px -8px",
                                                paddingTop: "5px",
                                                bottom: "0px",
                                                textAlign: "center",
                                                background: "none",
                                                borderTop: "none",
                                                borderBottom: "none",
                                            },
                                        }}
                                    />
                                </>
                            ) : null}
                        </div>
                    </div>

                    {showDocs ? (
                        <div className="graphiql-explorer-docs-container h-content-docs-container w-96 bg-white shadow rounded">
                            <DocExplorerComponent
                                schema={schema}
                                isEmbedded={false}
                                onClickClose={() => setShowDocs(false)}
                            />
                        </div>
                    ) : null}

                    <div className="w-content-container h-content-container-extended flex justify-start p-4">
                        <Grid
                            queryEditor={
                                schema ? (
                                    <GraphQLQueryEditor
                                        schema={schema}
                                        query={query}
                                        loading={loading}
                                        mirrorRef={refForQueryEditorMirror}
                                        onChangeQuery={(query) => {
                                            setQuery(query);
                                            debouncedSave({ lastQuery: query });
                                        }}
                                        executeQuery={onSubmit}
                                        buttons={
                                            <>
                                                <Button
                                                    aria-label="Prettify code"
                                                    className="mr-2"
                                                    color="neutral"
                                                    fill="outlined"
                                                    size="small"
                                                    onClick={formatTheCode}
                                                    disabled={loading}
                                                >
                                                    Prettify
                                                </Button>
                                                <IconButton
                                                    data-test-editor-query-button
                                                    aria-label="Execute query"
                                                    color="primary"
                                                    clean
                                                    // eslint-disable-next-line @typescript-eslint/no-misused-promises
                                                    onClick={() => onSubmit()}
                                                    disabled={!schema || loading}
                                                >
                                                    <PlayIconOutline
                                                        style={{
                                                            color: tokens.colors.primary[50],
                                                        }}
                                                    />
                                                </IconButton>
                                            </>
                                        }
                                    />
                                ) : null
                            }
                            parameterEditor={
                                <JSONEditor
                                    id={EDITOR_PARAMS_INPUT}
                                    fileName="params"
                                    loading={loading}
                                    fileExtension={Extension.JSON}
                                    readonly={false}
                                    initialValue={initVariableValues}
                                    onChange={(params) => {
                                        setVariableValues(params);
                                        debouncedSave({ lastParams: params });
                                    }}
                                />
                            }
                            resultView={
                                <JSONEditor
                                    id={EDITOR_RESPONSE_OUTPUT}
                                    fileName="response"
                                    loading={loading}
                                    fileExtension={Extension.JSON}
                                    readonly={true}
                                    json={output}
                                    onChange={setOutput}
                                />
                            }
                        />
                    </div>
                </div>
            </div>

            {showRightPanel ? (
                <div className="h-full flex justify-start w-96 bg-white border-l border-gray-100 z-50">
                    {settings.isShowHelpDrawer ? (
                        <HelpDrawer onClickClose={() => settings.setIsShowHelpDrawer(false)} schema={schema} />
                    ) : null}
                    {settings.isShowSettingsDrawer ? (
                        <AppSettings onClickClose={() => settings.setIsShowSettingsDrawer(false)} />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};
