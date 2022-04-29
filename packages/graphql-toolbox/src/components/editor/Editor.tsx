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

import { useCallback, useState, useRef, useEffect, useContext, Fragment } from "react";
import { graphql, GraphQLSchema } from "graphql";
import GraphiQLExplorer from "graphiql-explorer";
import { Button, HeroIcon } from "@neo4j-ndl/react";
import { EditorFromTextArea } from "codemirror";
import debounce from "lodash.debounce";
import { JSONEditor } from "./JSONEditor";
import { GraphQLQueryEditor } from "./GraphQLQueryEditor";
import {
    EDITOR_PARAMS_INPUT,
    EDITOR_QUERY_BUTTON,
    DEFAULT_QUERY,
    EDITOR_RESPONSE_OUTPUT,
    LOCAL_STATE_TYPE_LAST_PARAMS,
    LOCAL_STATE_TYPE_LAST_QUERY,
} from "../../constants";
import { Grid } from "./grid/Grid";
import { DocExplorer } from "./docexplorer/index";
import { formatCode, safeParse, ParserOptions } from "./utils";
import { Extension } from "../Filename";
import { ViewSelectorComponent } from "../ViewSelectorComponent";
import { SettingsContext } from "../../contexts/settings";
import { Theme, ThemeContext } from "../../contexts/theme";
import { AppSettings } from "../AppSettings";
import { ProTooltip } from "../ProTooltip";

const DEBOUNCE_TIMEOUT = 500;
export interface Props {
    schema?: GraphQLSchema;
}

export const Editor = (props: Props) => {
    const settings = useContext(SettingsContext);
    const theme = useContext(ThemeContext);
    const [initialLoad, setInitialLoad] = useState(false);
    const [loading, setLoading] = useState(false);
    const [query, setQuery] = useState("");
    const [variableValues, setVariableValues] = useState("");
    const [initVariableValues, setInitVariableValues] = useState("");
    const [output, setOutput] = useState("");
    const refForQueryEditorMirror = useRef<EditorFromTextArea | null>(null);
    const showRightPanel = settings.isShowDocsDrawer || settings.isShowSettingsDrawer;

    const debouncedSave = useCallback(
        debounce((key, value) => {
            localStorage.setItem(key, value);
        }, DEBOUNCE_TIMEOUT),
        []
    );

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
                    variableValues: safeParse(variableValues, {}),
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
        const initParams = JSON.parse(localStorage.getItem(LOCAL_STATE_TYPE_LAST_PARAMS) as string) || "";
        setInitialLoad(true);
        setQuery(initQuery);
        setVariableValues(initParams);
        setInitVariableValues(initParams);
    }, []);

    return (
        <div className="w-full flex">
            <div className="h-content-container flex justify-start w-96 bg-white graphiql-container">
                <div className="p-6">
                    {props.schema && initialLoad ? (
                        <GraphiQLExplorer
                            schema={props.schema}
                            query={query}
                            onEdit={setQuery}
                            onRunOperation={onSubmit}
                            explorerIsOpen={true}
                        />
                    ) : null}
                </div>
            </div>
            <div
                className={`h-content-container flex justify-start p-6 ${
                    showRightPanel ? "w-editor-container" : "w-full"
                }`}
            >
                <div className="flex flex-col w-full">
                    <div className="flex items-center w-full pb-4">
                        <div className="justify-start">
                            <ViewSelectorComponent
                                key="editor-view-selector"
                                elementKey="editor-view-selector"
                                isEditorDisabled={!!props.schema || loading}
                            />
                        </div>
                    </div>
                    <Grid
                        isRightPanelVisible={showRightPanel}
                        queryEditor={
                            props.schema ? (
                                <GraphQLQueryEditor
                                    schema={props.schema}
                                    query={query}
                                    loading={loading}
                                    mirrorRef={refForQueryEditorMirror}
                                    onChangeQuery={(query) => {
                                        setQuery(query);
                                        debouncedSave(LOCAL_STATE_TYPE_LAST_QUERY, JSON.stringify(query));
                                    }}
                                    executeQuery={onSubmit}
                                    buttons={
                                        <Fragment>
                                            <ProTooltip tooltipText="Prettify" width={60} left={-10} top={38}>
                                                <Button
                                                    className="p-2"
                                                    color={theme.theme === Theme.DARK ? "success" : "neutral"}
                                                    fill="text"
                                                    buttonSize="small"
                                                    style={{ padding: "0.5rem", display: "flex" }}
                                                    onClick={formatTheCode}
                                                    disabled={loading}
                                                >
                                                    <HeroIcon className="h-6 w-6" iconName="CodeIcon" type="outline" />
                                                </Button>
                                            </ProTooltip>
                                            <Button
                                                id={EDITOR_QUERY_BUTTON}
                                                className="mr-4 ml-2"
                                                color="primary"
                                                fill="text"
                                                style={{ padding: "0.5rem" }}
                                                onClick={() => onSubmit()}
                                                disabled={!props.schema || loading}
                                            >
                                                <HeroIcon className="h-7 w-7" iconName="PlayIcon" type="outline" />
                                            </Button>
                                        </Fragment>
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
                                    debouncedSave(LOCAL_STATE_TYPE_LAST_PARAMS, JSON.stringify(params));
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
            {showRightPanel ? (
                <div className="h-content-container flex justify-start w-96 bg-white">
                    {settings.isShowDocsDrawer ? (
                        <div className="p-6">
                            <DocExplorer schema={props.schema}>
                                <button
                                    className="docExplorerCloseIcon"
                                    onClick={() => settings.setIsShowDocsDrawer(false)}
                                    aria-label="Close Documentation Explorer"
                                >
                                    {"\u2715"}
                                </button>
                            </DocExplorer>
                        </div>
                    ) : null}
                    {settings.isShowSettingsDrawer ? (
                        <AppSettings onClickClose={() => settings.setIsShowSettingsDrawer(false)} />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};
