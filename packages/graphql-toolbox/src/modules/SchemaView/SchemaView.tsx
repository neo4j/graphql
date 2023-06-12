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

import { autocompletion, closeBrackets, closeBracketsKeymap, completionKeymap } from "@codemirror/autocomplete";
import { defaultKeymap, history, historyKeymap, indentWithTab } from "@codemirror/commands";
import { bracketMatching, foldGutter, foldKeymap, indentOnInput } from "@codemirror/language";
import { lintKeymap } from "@codemirror/lint";
import { highlightSelectionMatches, searchKeymap } from "@codemirror/search";
import { EditorState, StateEffect } from "@codemirror/state";
import {
    drawSelection,
    dropCursor,
    EditorView,
    highlightActiveLine,
    highlightSpecialChars,
    keymap,
    lineNumbers,
} from "@codemirror/view";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import { Banner } from "@neo4j-ndl/react";
import { graphql, updateSchema } from "cm6-graphql";
import type { GraphQLError, GraphQLSchema } from "graphql";
import * as neo4j from "neo4j-driver";
import { dracula, tomorrow } from "thememirror";

import { rudimentaryTypeDefinitionsAnalytics } from "../../analytics/analytics";
import { tracking } from "../../analytics/tracking";
import { DEFAULT_DATABASE_NAME, DEFAULT_TYPE_DEFS } from "../../constants";
import { AppSettingsContext } from "../../contexts/appsettings";
import { AuthContext } from "../../contexts/auth";
import { SettingsContext } from "../../contexts/settings";
import { Theme, ThemeContext } from "../../contexts/theme";
import { useStore } from "../../store";
import type { Favorite } from "../../types";
import { ConstraintState } from "../../types";
import { AppSettings } from "../AppSettings/AppSettings";
import { formatCode, ParserOptions } from "../EditorView/utils";
import { HelpDrawer } from "../HelpDrawer/HelpDrawer";
import { Favorites } from "./Favorites";
import { IntrospectionPrompt } from "./IntrospectionPrompt";
import { SchemaEditor } from "./SchemaEditor";
import { SchemaErrorDisplay } from "./SchemaErrorDisplay";
import { SchemaSettings } from "./SchemaSettings";
import { getSchemaForLintAndAutocompletion } from "./utils";

export interface Props {
    onSchemaChange: (schema: GraphQLSchema) => void;
}

export const SchemaView = ({ onSchemaChange }: Props) => {
    const theme = useContext(ThemeContext);
    const auth = useContext(AuthContext);
    const settings = useContext(SettingsContext);
    const appSettings = useContext(AppSettingsContext);
    const [error, setError] = useState<string | GraphQLError>("");
    const [showIntrospectionModal, setShowIntrospectionModal] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [isIntrospecting, setIsIntrospecting] = useState<boolean>(false);
    const elementRef = useRef<HTMLDivElement | null>(null);
    const favorites = useStore((store) => store.favorites);
    const showRightPanel = settings.isShowHelpDrawer || settings.isShowSettingsDrawer;
    const [editorView, setEditorView] = useState<EditorView | null>(null);
    const storedTypeDefs = useStore.getState().typeDefinitions || DEFAULT_TYPE_DEFS;

    const extensions = [
        lineNumbers(),
        highlightSpecialChars(),
        highlightActiveLine(),
        bracketMatching(),
        closeBrackets(),
        history(),
        dropCursor(),
        drawSelection(),
        indentOnInput(),
        autocompletion({ defaultKeymap: true, maxRenderedOptions: 5 }),
        highlightSelectionMatches(),
        EditorView.lineWrapping,
        keymap.of([
            indentWithTab,
            ...closeBracketsKeymap,
            ...defaultKeymap,
            ...searchKeymap,
            ...historyKeymap,
            ...foldKeymap,
            ...completionKeymap,
            ...lintKeymap,
        ]),
        foldGutter({
            closedText: "▶",
            openText: "▼",
        }),
        graphql(getSchemaForLintAndAutocompletion()),
        theme.theme === Theme.LIGHT ? tomorrow : dracula,
    ];

    useEffect(() => {
        if (elementRef.current === null) {
            return;
        }

        const state = EditorState.create({
            doc: storedTypeDefs,
            extensions,
        });

        const view = new EditorView({
            state,
            parent: elementRef.current,
        });

        setEditorView(view);

        return () => {
            view.destroy();
            setEditorView(null);
        };
    }, [elementRef.current]);

    useEffect(() => {
        if (editorView) {
            editorView.dispatch({ effects: StateEffect.reconfigure.of(extensions) });
        }
    }, [theme.theme, extensions]);

    const formatTheCode = (): void => {
        if (!editorView) return;
        formatCode(editorView, ParserOptions.GRAPH_QL);
    };

    const saveAsFavorite = (): void => {
        const value = editorView?.state.doc.toString();
        if (!value) return;
        const newFavorites: Favorite[] = [
            ...(favorites || []),
            { id: new Date().getTime().toString(), name: value.substring(0, 24), typeDefs: value },
        ];
        useStore.setState({ favorites: newFavorites });
        tracking.trackSaveFavorite({ screen: "type definitions" });
    };

    const setTypeDefsFromFavorite = (typeDefs: string) => {
        if (!editorView) return;
        editorView.dispatch({
            changes: { from: 0, to: editorView.state.doc.length, insert: typeDefs },
        });
    };

    const buildSchema = useCallback(
        async (typeDefs: string) => {
            try {
                setLoading(true);

                useStore.setState({ typeDefinitions: typeDefs });

                const features = useStore.getState().enableRegex
                    ? {
                          filters: {
                              String: {
                                  MATCHES: true,
                              },
                              ID: {
                                  MATCHES: true,
                              },
                          },
                      }
                    : {};

                const options = {
                    typeDefs,
                    driver: auth.driver,
                    features,
                    config: {
                        enableDebug: useStore.getState().enableDebug,
                        driverConfig: {
                            database: auth.selectedDatabaseName || DEFAULT_DATABASE_NAME,
                        },
                    },
                };

                const neoSchema = new Neo4jGraphQL(options);

                const schema = await neoSchema.getSchema();

                if (editorView) {
                    updateSchema(editorView, schema);
                }

                if (useStore.getState().constraint === ConstraintState.check.toString()) {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: false } });
                }

                if (useStore.getState().constraint === ConstraintState.create.toString()) {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: true } });
                }

                const analyticsResults = rudimentaryTypeDefinitionsAnalytics(typeDefs);
                tracking.trackBuildSchema({ screen: "type definitions", ...analyticsResults });

                onSchemaChange(schema);
            } catch (error) {
                setError(error as GraphQLError);
            } finally {
                setLoading(false);
            }
        },
        [auth.selectedDatabaseName]
    );

    const introspect = useCallback(
        async ({ screen }: { screen: "query editor" | "type definitions" | "initial modal" }) => {
            try {
                if (!editorView) return;

                setLoading(true);
                setIsIntrospecting(true);

                const sessionFactory = () =>
                    auth?.driver?.session({
                        defaultAccessMode: neo4j.session.READ,
                        database: auth.selectedDatabaseName || DEFAULT_DATABASE_NAME,
                    }) as neo4j.Session;

                const typeDefs = await toGraphQLTypeDefs(sessionFactory);
                editorView.dispatch({
                    changes: { from: 0, to: editorView.state.doc.length, insert: typeDefs },
                });

                tracking.trackDatabaseIntrospection({ screen, status: "success" });
            } catch (error) {
                const msg = (error as GraphQLError).message;
                setError(msg);
                tracking.trackDatabaseIntrospection({ screen, status: "failure" });
            } finally {
                setLoading(false);
                setIsIntrospecting(false);
            }
        },
        [buildSchema, editorView, auth.selectedDatabaseName]
    );

    const onSubmit = () => {
        if (!editorView) return;
        const value = editorView?.state.doc.toString();
        if (value) {
            buildSchema(value).catch(() => null);
        }
    };

    const onClickIntrospect = async () => {
        await introspect({ screen: "type definitions" });
        formatTheCode();
    };

    return (
        <div className="w-full flex">
            {auth.showIntrospectionPrompt ? (
                <IntrospectionPrompt
                    open={showIntrospectionModal}
                    onClose={() => {
                        setShowIntrospectionModal(false);
                        auth.setShowIntrospectionPrompt(false);
                    }}
                    onDisconnect={() => {
                        setShowIntrospectionModal(false);
                        auth.setShowIntrospectionPrompt(false);
                        auth.logout();
                    }}
                    onIntrospect={() => {
                        setShowIntrospectionModal(false);
                        auth.setShowIntrospectionPrompt(false);

                        introspect({ screen: "initial modal" }).catch(() => null);
                    }}
                />
            ) : null}
            <div className={`flex flex-col ${showRightPanel ? "w-content-container" : "w-full"}`}>
                <div className="flex">
                    <div className="h-content-container flex justify-start w-96 bg-white border-t border-gray-100 overflow-y-auto">
                        <div className="w-full">
                            <SchemaSettings />
                            <hr />
                            <Favorites favorites={favorites} onSelectFavorite={setTypeDefsFromFavorite} />
                        </div>
                    </div>
                    <div className="flex-1 flex justify-start w-full p-4" style={{ height: "calc(100% - 3rem)" }}>
                        <div className="flex flex-col w-full h-full">
                            <SchemaErrorDisplay error={error} />
                            <SchemaEditor
                                elementRef={elementRef}
                                loading={loading}
                                isIntrospecting={isIntrospecting}
                                formatTheCode={formatTheCode}
                                introspect={onClickIntrospect}
                                saveAsFavorite={saveAsFavorite}
                                onSubmit={onSubmit}
                            />
                            {!appSettings.hideProductUsageMessage ? (
                                <Banner
                                    className="absolute bottom-7 ml-4 w-[44rem] z-40"
                                    closeable
                                    name="ProductUsageMessage"
                                    title={<strong>Product analytics</strong>}
                                    description={
                                        <>
                                            <p>
                                                To help make the Neo4j GraphQL Toolbox better we collect data on product
                                                usage.
                                            </p>
                                            <p>Review your settings at any time.</p>
                                        </>
                                    }
                                    onClose={() => appSettings.setHideProductUsageMessage(true)}
                                />
                            ) : null}
                        </div>
                    </div>
                </div>
            </div>
            {showRightPanel ? (
                <div className="h-content-container flex justify-start w-96 bg-white border-l border-gray-100 z-50">
                    {settings.isShowHelpDrawer ? (
                        <HelpDrawer onClickClose={() => settings.setIsShowHelpDrawer(false)} />
                    ) : null}
                    {settings.isShowSettingsDrawer ? (
                        <AppSettings onClickClose={() => settings.setIsShowSettingsDrawer(false)} />
                    ) : null}
                </div>
            ) : null}
        </div>
    );
};
