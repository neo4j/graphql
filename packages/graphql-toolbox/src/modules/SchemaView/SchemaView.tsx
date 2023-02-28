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

import { useCallback, useContext, useRef, useState } from "react";
import { Neo4jGraphQL } from "@neo4j/graphql";
import { toGraphQLTypeDefs } from "@neo4j/introspector";
import { Banner } from "@neo4j-ndl/react";
import { GraphQLError, GraphQLSchema } from "graphql";
import * as neo4j from "neo4j-driver";
import { EditorFromTextArea } from "codemirror";
import {
    DEFAULT_DATABASE_NAME,
    LOCAL_STATE_CONSTRAINT,
    LOCAL_STATE_ENABLE_DEBUG,
    LOCAL_STATE_ENABLE_REGEX,
    LOCAL_STATE_FAVORITES,
    LOCAL_STATE_TYPE_DEFS,
} from "../../constants";
import { formatCode, ParserOptions } from "../EditorView/utils";
import { AuthContext } from "../../contexts/auth";
import { SettingsContext } from "../../contexts/settings";
import { AppSettingsContext } from "../../contexts/appsettings";
import { AppSettings } from "../AppSettings/AppSettings";
import { HelpDrawer } from "../HelpDrawer/HelpDrawer";
import { Storage } from "../../utils/storage";
import { SchemaSettings } from "./SchemaSettings";
import { SchemaErrorDisplay } from "./SchemaErrorDisplay";
import { ActionElementsBar } from "./ActionElementsBar";
import { SchemaEditor } from "./SchemaEditor";
import { ConstraintState, Favorite } from "../../types";
import { Favorites } from "./Favorites";
import { IntrospectionPrompt } from "./IntrospectionPrompt";
import { tracking } from "../../analytics/tracking";
import { rudimentaryTypeDefinitionsAnalytics } from "../../analytics/analytics";

export interface Props {
    hasSchema: boolean;
    onChange: (schema: GraphQLSchema) => void;
}

export const SchemaView = ({ hasSchema, onChange }: Props) => {
    const auth = useContext(AuthContext);
    const settings = useContext(SettingsContext);
    const appSettings = useContext(AppSettingsContext);
    const [error, setError] = useState<string | GraphQLError>("");
    const [showIntrospectionModal, setShowIntrospectionModal] = useState<boolean>(true);
    const [loading, setLoading] = useState<boolean>(false);
    const [isIntrospecting, setIsIntrospecting] = useState<boolean>(false);
    const refForEditorMirror = useRef<EditorFromTextArea | null>(null);
    const [isDebugChecked, setIsDebugChecked] = useState<string | null>(Storage.retrieve(LOCAL_STATE_ENABLE_DEBUG));
    const [isRegexChecked, setIsRegexChecked] = useState<string | null>(Storage.retrieve(LOCAL_STATE_ENABLE_REGEX));
    const [constraintState, setConstraintState] = useState<string | null>(Storage.retrieve(LOCAL_STATE_CONSTRAINT));
    const [favorites, setFavorites] = useState<Favorite[] | null>(Storage.retrieveJSON(LOCAL_STATE_FAVORITES));
    const showRightPanel = settings.isShowHelpDrawer || settings.isShowSettingsDrawer;

    const formatTheCode = (): void => {
        if (!refForEditorMirror.current) return;
        formatCode(refForEditorMirror.current, ParserOptions.GRAPH_QL);
    };

    const saveAsFavorite = (): void => {
        const value = refForEditorMirror.current?.getValue();
        if (!value) return;
        const newFavorites: Favorite[] = [
            ...(favorites || []),
            { id: new Date().getTime().toString(), name: value.substring(0, 24), typeDefs: value },
        ];
        setFavorites(newFavorites);
        Storage.storeJSON(LOCAL_STATE_FAVORITES, newFavorites);
        tracking.trackSaveFavorite({ screen: "type definitions" });
    };

    const setTypeDefsFromFavorite = (typeDefs: string) => {
        if (!typeDefs || !refForEditorMirror) return;
        refForEditorMirror.current?.setValue(typeDefs);
    };

    const buildSchema = useCallback(
        async (typeDefs: string) => {
            try {
                setLoading(true);

                Storage.storeJSON(LOCAL_STATE_TYPE_DEFS, typeDefs);

                const options = {
                    typeDefs,
                    driver: auth.driver,
                    config: {
                        enableDebug: isDebugChecked === "true",
                        enableRegex: isRegexChecked === "true",
                        driverConfig: {
                            database: auth.selectedDatabaseName || DEFAULT_DATABASE_NAME,
                        },
                    },
                };

                const neoSchema = new Neo4jGraphQL(options);

                const schema = await neoSchema.getSchema();

                if (constraintState === ConstraintState.check.toString()) {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: false } });
                }

                if (constraintState === ConstraintState.create.toString()) {
                    await neoSchema.assertIndexesAndConstraints({ driver: auth.driver, options: { create: true } });
                }

                const analyticsResults = rudimentaryTypeDefinitionsAnalytics(typeDefs);
                tracking.trackBuildSchema({ screen: "type definitions", ...analyticsResults });

                onChange(schema);
            } catch (error) {
                setError(error as GraphQLError);
            } finally {
                setLoading(false);
            }
        },
        [isDebugChecked, constraintState, isRegexChecked, auth.selectedDatabaseName],
    );

    const introspect = useCallback(
        async ({ screen }: { screen: "query editor" | "type definitions" | "initial modal" }) => {
            try {
                setLoading(true);
                setIsIntrospecting(true);

                const sessionFactory = () =>
                    auth?.driver?.session({
                        defaultAccessMode: neo4j.session.READ,
                        database: auth.selectedDatabaseName || DEFAULT_DATABASE_NAME,
                    }) as neo4j.Session;

                const typeDefs = await toGraphQLTypeDefs(sessionFactory);

                refForEditorMirror.current?.setValue(typeDefs);

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
        [buildSchema, refForEditorMirror.current, auth.selectedDatabaseName],
    );

    const onSubmit = useCallback(async () => {
        const value = refForEditorMirror.current?.getValue();
        if (value) {
            await buildSchema(value);
        }
    }, [buildSchema]);

    const onClickIntrospect = async () => {
        await introspect({ screen: "type definitions" });
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
                        // eslint-disable-next-line @typescript-eslint/no-floating-promises
                        introspect({ screen: "initial modal" });
                    }}
                />
            ) : null}
            <div className={`flex flex-col ${showRightPanel ? "w-content-container" : "w-full"}`}>
                <div className="h-12 w-full bg-white">
                    {/* eslint-disable-next-line @typescript-eslint/no-misused-promises */}
                    <ActionElementsBar hasSchema={hasSchema} loading={loading} onSubmit={onSubmit} />
                </div>
                <div className="flex">
                    <div className="h-content-container-extended flex justify-start w-96 bg-white border-t border-gray-100">
                        <div className="p-6 w-full">
                            <SchemaSettings
                                isRegexChecked={isRegexChecked}
                                isDebugChecked={isDebugChecked}
                                constraintState={constraintState}
                                setIsRegexChecked={setIsRegexChecked}
                                setIsDebugChecked={setIsDebugChecked}
                                setConstraintState={setConstraintState}
                            />
                            <hr className="my-8" />
                            <Favorites
                                favorites={favorites}
                                setFavorites={setFavorites}
                                onSelectFavorite={setTypeDefsFromFavorite}
                            />
                        </div>
                    </div>
                    <div className="flex-1 flex justify-start w-full p-4" style={{ height: "86vh" }}>
                        <div className="flex flex-col w-full h-full">
                            <SchemaErrorDisplay error={error} />
                            <SchemaEditor
                                mirrorRef={refForEditorMirror}
                                loading={loading}
                                isIntrospecting={isIntrospecting}
                                formatTheCode={formatTheCode}
                                introspect={onClickIntrospect}
                                saveAsFavorite={saveAsFavorite}
                            />
                            {!appSettings.hideProductUsageMessage ? (
                                <Banner
                                    className="absolute bottom-7 ml-4 w-[57rem] z-40"
                                    closeable
                                    name="ProductUsageMessage"
                                    title={<strong>Product analytics</strong>}
                                    description="To help make the Neo4j GraphQL Toolbox better we collect data on product usage. Review your settings at any time."
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
