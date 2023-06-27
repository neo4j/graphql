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

import { useCallback, useContext, useState } from "react";

import { tokens } from "@neo4j-ndl/base";
import { Switch } from "@neo4j-ndl/react";
import GraphiQLExplorer from "graphiql-explorer";
import type { GraphQLSchema } from "graphql";
import { graphql } from "graphql";

import { tracking } from "../../analytics/tracking";
import { Extension } from "../../components/Filename";
import { EDITOR_PARAMS_INPUT, EDITOR_RESPONSE_OUTPUT } from "../../constants";
import { Screen } from "../../contexts/screen";
import { SettingsContext } from "../../contexts/settings";
import { useStore } from "../../store";
import { AppSettings } from "../AppSettings/AppSettings";
import { DocExplorerComponent } from "../HelpDrawer/DocExplorerComponent";
import { HelpDrawer } from "../HelpDrawer/HelpDrawer";
import { EditorTabs } from "./EditorTabs";
import { Grid } from "./grid/Grid";
import { QueryEditor } from "./QueryEditor";
import { ResponseEditor } from "./ResponseEditor";
import { calculateQueryComplexity, safeParse } from "./utils";
import { VariablesEditor } from "./VariablesEditor";

export interface Props {
    schema?: GraphQLSchema;
}

export const EditorView = ({ schema }: Props) => {
    const store = useStore();
    const settings = useContext(SettingsContext);
    const [loading, setLoading] = useState<boolean>(false);
    const [showDocs, setShowDocs] = useState<boolean>(false);
    const showRightPanel = settings.isShowHelpDrawer || settings.isShowSettingsDrawer;

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
                    source: override || useStore.getState().getActiveTab().query || "",
                    contextValue: {},
                    variableValues: safeParse(useStore.getState().getActiveTab().variables, {}),
                });

                result = JSON.stringify(response);
            } catch (error) {
                result = JSON.stringify({ errors: [error] });
            }

            const complexity = calculateQueryComplexity(
                schema,
                override || useStore.getState().getActiveTab().query || "",
                useStore.getState().getActiveTab().variables
            );
            tracking.trackExecuteQuery({ screen: "query editor", queryComplexity: complexity });

            setTimeout(() => {
                store.updateResponse(result, useStore.getState().activeTabIndex);
                setLoading(false);
            }, 500);
        },
        [setLoading]
    );

    return (
        <div className="w-full h-full flex">
            <div className={`flex flex-col ${showRightPanel ? "w-content-container" : "w-full"}`}>
                <div className="w-full h-full flex">
                    <div className="h-full w-96 bg-white border-t border-gray-100">
                        <div className="h-content-docs-container p-6">
                            {schema ? (
                                <>
                                    <div className="flex justify-end">
                                        <Switch
                                            data-test-explorer-show-docs-switch
                                            label="Docs"
                                            checked={showDocs}
                                            onChange={handleShowDocs}
                                        />
                                    </div>
                                    <GraphiQLExplorer
                                        schema={schema}
                                        query={useStore.getState().getActiveTab().query}
                                        onEdit={(query: string) => {
                                            store.updateQuery(query, useStore.getState().activeTabIndex);
                                        }}
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
                        <div className="h-content-docs-container w-96 absolute left-[388px] my-1 mx-0 z-50 bg-white shadow rounded">
                            <DocExplorerComponent
                                schema={schema}
                                isEmbedded={false}
                                onClickClose={() => setShowDocs(false)}
                            />
                        </div>
                    ) : null}

                    <div className="w-content-container h-content-container flex flex-col justify-start p-4">
                        <EditorTabs />
                        <Grid
                            queryEditor={
                                schema ? <QueryEditor loading={loading} onSubmit={onSubmit} schema={schema} /> : null
                            }
                            variablesEditor={
                                <VariablesEditor
                                    id={EDITOR_PARAMS_INPUT}
                                    fileName="params"
                                    fileExtension={Extension.JSON}
                                    loading={loading}
                                />
                            }
                            resultView={
                                <ResponseEditor
                                    id={EDITOR_RESPONSE_OUTPUT}
                                    fileName="response"
                                    fileExtension={Extension.JSON}
                                    loading={loading}
                                    borderRadiusTop={false}
                                    value={useStore.getState().getActiveTab().response}
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
