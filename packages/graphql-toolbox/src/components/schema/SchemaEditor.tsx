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
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import { GraphQLSchema } from "graphql";
import { Button, Checkbox, HeroIcon } from "@neo4j-ndl/react";
import * as neo4j from "neo4j-driver";
import { EditorFromTextArea } from "codemirror";
import { CodeMirror } from "../../utils/utils";
import {
    DEFAULT_TYPE_DEFS,
    LOCAL_STATE_CHECK_CONSTRAINT,
    LOCAL_STATE_CREATE_CONSTRAINT,
    LOCAL_STATE_DEBUG,
    LOCAL_STATE_ENABLE_REGEX,
    LOCAL_STATE_TYPE_DEFS,
    SCHEMA_EDITOR_BUILD_BUTTON,
    SCHEMA_EDITOR_INPUT,
    SCHEMA_EDITOR_INTROSPECT_BUTTON,
    SCHEMA_EDITOR_PRETTY_BUTTON,
    THEME_EDITOR_DARK,
    THEME_EDITOR_LIGHT,
} from "../../constants";
import { formatCode, ParserOptions } from "../editor/utils";
import { Extension, FileName } from "../Filename";
import { AuthContext } from "../../contexts/auth";
import { SettingsContext } from "../../contexts/settings";
import { ThemeContext, Theme } from "../../contexts/theme";
import { ViewSelectorComponent } from "../ViewSelectorComponent";
import { AppSettings } from "../AppSettings";
import { ProTooltip } from "../ProTooltip";

export interface Props {
    hasSchema: boolean;
    onChange: (s: GraphQLSchema) => void;
}

export const SchemaEditor = ({ hasSchema, onChange }: Props) => {
    const auth = useContext(AuthContext);
    const theme = useContext(ThemeContext);
    const settings = useContext(SettingsContext);
    const ref = useRef<HTMLTextAreaElement>();
    const [mirror, setMirror] = useState<EditorFromTextArea | null>(null);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [isDebugChecked, setIsDebugChecked] = useState<string | null>(localStorage.getItem(LOCAL_STATE_DEBUG));
    const [isCheckConstraintChecked, setIsCheckConstraintChecked] = useState<string | null>(
        localStorage.getItem(LOCAL_STATE_CHECK_CONSTRAINT)
    );
    const [isCreateConstraintChecked, setIsCreateConstraintChecked] = useState<string | null>(
        localStorage.getItem(LOCAL_STATE_CREATE_CONSTRAINT)
    );
    const [isEnableDebugChecked, setIsEnableDebugChecked] = useState<string | null>(
        localStorage.getItem(LOCAL_STATE_ENABLE_REGEX)
    );

    const onChangeDebugCheckbox = (): void => {
        const next = isDebugChecked === "true" ? "false" : "true";
        setIsDebugChecked(next);
        localStorage.setItem(LOCAL_STATE_DEBUG, next);
    };

    const onChangeCheckConstraintCheckbox = (): void => {
        const nextCheck = isCheckConstraintChecked === "true" ? "false" : "true";
        if (isCreateConstraintChecked === "true") return;
        setIsCheckConstraintChecked(nextCheck);
        localStorage.setItem(LOCAL_STATE_CHECK_CONSTRAINT, nextCheck);
    };

    const onChangeCreateConstraintCheckbox = (): void => {
        const nextCreate = isCreateConstraintChecked === "true" ? "false" : "true";
        if (isCheckConstraintChecked === "true") return;
        setIsCreateConstraintChecked(nextCreate);
        localStorage.setItem(LOCAL_STATE_CREATE_CONSTRAINT, nextCreate);
    };

    const onChangeEnableRegexCheckbox = (): void => {
        const next = isEnableDebugChecked === "true" ? "false" : "true";
        setIsEnableDebugChecked(next);
        localStorage.setItem(LOCAL_STATE_ENABLE_REGEX, next);
    };

    const formatTheCode = (): void => {
        if (!mirror) return;
        formatCode(mirror, ParserOptions.GRAPH_QL);
    };

    const getStoredTypeDefs = (): string | undefined => {
        const data = localStorage.getItem(LOCAL_STATE_TYPE_DEFS);
        if (!data) return undefined;
        return JSON.parse(data as string);
    };

    const buildSchema = useCallback(
        async (typeDefs: string) => {
            try {
                setLoading(true);

                localStorage.setItem(LOCAL_STATE_TYPE_DEFS, JSON.stringify(typeDefs));

                const options = {
                    typeDefs,
                    driver: auth.driver,
                    config: {
                        enableDebug: isDebugChecked === "true",
                        enableRegex: isEnableDebugChecked === "true",
                    },
                };

                const neoSchema = new Neo4jGraphQL(options);

                const schema = await neoSchema.getSchema();

                if (isCheckConstraintChecked === "true") {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: false } });
                }

                if (isCreateConstraintChecked === "true") {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: true } });
                }

                onChange(schema);
            } catch (error) {
                const msg = (error as Error).message;
                setError(msg);
            } finally {
                setLoading(false);
            }
        },
        [isDebugChecked, isCheckConstraintChecked, isCreateConstraintChecked, isEnableDebugChecked]
    );

    const introspect = useCallback(async () => {
        try {
            setLoading(true);

            const sessionFactory = () =>
                auth?.driver?.session({ defaultAccessMode: neo4j.session.READ }) as neo4j.Session;

            const typeDefs = await toGraphQLTypeDefs(sessionFactory);

            mirror?.setValue(typeDefs);
        } catch (error) {
            const msg = (error as Error).message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [buildSchema, mirror]);

    const onSubmit = useCallback(() => {
        if (ref.current?.value) {
            buildSchema(ref.current?.value);
        }
    }, [ref.current?.value, buildSchema]);

    useEffect(() => {
        if (ref.current === null) {
            return;
        }

        const mirror = CodeMirror.fromTextArea(ref.current as HTMLTextAreaElement, {
            lineNumbers: true,
            tabSize: 2,
            mode: "graphql",
            theme: theme.theme === Theme.LIGHT ? THEME_EDITOR_LIGHT : THEME_EDITOR_DARK,
            keyMap: "sublime",
            autoCloseBrackets: true,
            matchBrackets: true,
            showCursorWhenSelecting: true,
            lineWrapping: true,
            foldGutter: {
                // @ts-ignore - Added By GraphQL Plugin
                minFoldSize: 4,
            },
            gutters: ["CodeMirror-linenumbers", "CodeMirror-foldgutter"],
            extraKeys: {
                "Ctrl-L": () => {
                    if (!mirror) return;
                    formatCode(mirror, ParserOptions.GRAPH_QL);
                },
            },
        });
        setMirror(mirror);

        const storedTypeDefs = getStoredTypeDefs() || DEFAULT_TYPE_DEFS;
        if (storedTypeDefs && ref.current) {
            mirror?.setValue(storedTypeDefs);
            ref.current.value = storedTypeDefs;
        }

        mirror.on("change", (e) => {
            if (ref.current) {
                ref.current.value = e.getValue();
            }
        });
    }, [ref]);

    useEffect(() => {
        const t = theme.theme === Theme.LIGHT ? THEME_EDITOR_LIGHT : THEME_EDITOR_DARK;
        mirror?.setOption("theme", t);
    }, [theme.theme]);

    return (
        <div className="w-full flex">
            <div className="h-content-container flex justify-start w-96 bg-white">
                <div className="p-6">
                    <span className="h5">Schema settings</span>
                    <div className="pt-4">
                        <Checkbox
                            className="m-0"
                            label="Enable Regex"
                            checked={isEnableDebugChecked === "true"}
                            onChange={onChangeEnableRegexCheckbox}
                        />
                        <Checkbox
                            className="m-0"
                            label="Enable Debug"
                            checked={isDebugChecked === "true"}
                            onChange={onChangeDebugCheckbox}
                        />
                        <Checkbox
                            className="m-0"
                            label="Check Constraint"
                            checked={isCheckConstraintChecked === "true"}
                            onChange={onChangeCheckConstraintCheckbox}
                        />
                        <Checkbox
                            className="m-0"
                            label="Create Constraint"
                            checked={isCreateConstraintChecked === "true"}
                            onChange={onChangeCreateConstraintCheckbox}
                        />
                    </div>
                </div>
            </div>
            <div className="flex-1 flex justify-start w-full p-6" style={{ height: "87vh" }}>
                <div className="flex flex-col w-full h-full">
                    <div className="flex items-center w-full pb-4">
                        <div className="justify-start">
                            <ProTooltip
                                tooltipText="Build the schema to use the Editor"
                                arrowPositionLeft={true}
                                blockVisibility={hasSchema}
                                width={210}
                                left={200}
                                top={1}
                            >
                                <ViewSelectorComponent
                                    key="schema-editor-view-selector"
                                    elementKey="schema-editor-view-selector"
                                    isEditorDisabled={!hasSchema}
                                />
                            </ProTooltip>
                        </div>
                        <div className="flex-1 flex justify-end">
                            <ProTooltip tooltipText="Prettify" width={60} left={-2} top={45}>
                                <Button
                                    id={SCHEMA_EDITOR_PRETTY_BUTTON}
                                    className="mr-4"
                                    color="neutral"
                                    fill="outlined"
                                    style={{ padding: "0.75rem" }}
                                    onClick={formatTheCode}
                                    disabled={loading}
                                >
                                    <HeroIcon className="h-7 w-7" iconName="CodeIcon" type="outline" />
                                </Button>
                            </ProTooltip>
                            <Button
                                id={SCHEMA_EDITOR_INTROSPECT_BUTTON}
                                className="mr-4"
                                color="neutral"
                                fill="outlined"
                                onClick={introspect}
                                disabled={loading}
                            >
                                Generate typeDefs
                            </Button>
                            <Button
                                id={SCHEMA_EDITOR_BUILD_BUTTON}
                                style={{ backgroundColor: "#006FD6" }}
                                fill="filled"
                                onClick={onSubmit}
                                disabled={loading}
                            >
                                Build schema
                            </Button>
                        </div>
                    </div>
                    {error && (
                        <div
                            className="mt-5 mb-5 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                            role="alert"
                        >
                            <strong className="font-bold">Holy smokes! </strong>
                            <span className="block sm:inline">{error}</span>
                        </div>
                    )}
                    <div style={{ width: "100%", height: "100%" }}>
                        <FileName extension={Extension.GRAPHQL} name={"schema"}></FileName>
                        <textarea
                            id={SCHEMA_EDITOR_INPUT}
                            /* @ts-ignore - Not Sure about this one*/
                            ref={ref}
                            style={{ width: "100%", height: "100%" }}
                            disabled={loading}
                        />
                    </div>
                </div>
            </div>
            {settings.isShowSettingsDrawer ? (
                <div className="h-content-container flex justify-start w-96 bg-white">
                    <AppSettings onClickClose={() => settings.setIsShowSettingsDrawer(false)} />
                </div>
            ) : null}
        </div>
    );
};
