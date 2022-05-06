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
import { GraphQLError, GraphQLSchema } from "graphql";
import * as neo4j from "neo4j-driver";
import { EditorFromTextArea } from "codemirror";
import {
    LOCAL_STATE_CHECK_CONSTRAINT,
    LOCAL_STATE_CREATE_CONSTRAINT,
    LOCAL_STATE_ENABLE_DEBUG,
    LOCAL_STATE_ENABLE_REGEX,
    LOCAL_STATE_FAVOURITES,
    LOCAL_STATE_TYPE_DEFS,
} from "../../constants";
import { formatCode, ParserOptions } from "../EditorView/utils";
import { AuthContext } from "../../contexts/auth";
import { SettingsContext } from "../../contexts/settings";
import { AppSettings } from "../AppSettings/AppSettings";
import { HelpDrawer } from "../HelpDrawer/HelpDrawer";
import { Storage } from "../../utils/storage";
import { SchemaSettings } from "./SchemaSettings";
import { SchemaErrorDisplay } from "./SchemaErrorDisplay";
import { ActionElementsBar } from "./ActionElementsBar";
import { SchemaEditor } from "./SchemaEditor";
import { Favourite } from "src/types";
import { Favourites } from "./Favourites";

export interface Props {
    hasSchema: boolean;
    onChange: (schema: GraphQLSchema) => void;
}

export const SchemaView = ({ hasSchema, onChange }: Props) => {
    const auth = useContext(AuthContext);
    const settings = useContext(SettingsContext);
    const [error, setError] = useState<string | GraphQLError>("");
    const [loading, setLoading] = useState(false);
    const refForEditorMirror = useRef<EditorFromTextArea | null>(null);
    const [isDebugChecked, setIsDebugChecked] = useState<string | null>(Storage.retrieve(LOCAL_STATE_ENABLE_DEBUG));
    const [isCheckConstraintChecked, setIsCheckConstraintChecked] = useState<string | null>(
        Storage.retrieve(LOCAL_STATE_CHECK_CONSTRAINT)
    );
    const [isCreateConstraintChecked, setIsCreateConstraintChecked] = useState<string | null>(
        Storage.retrieve(LOCAL_STATE_CREATE_CONSTRAINT)
    );
    const [isRegexChecked, setIsRegexChecked] = useState<string | null>(Storage.retrieve(LOCAL_STATE_ENABLE_REGEX));
    const [favourites, setFavourites] = useState<Favourite[] | null>(Storage.retrieveJSON(LOCAL_STATE_FAVOURITES));
    const showRightPanel = settings.isShowHelpDrawer || settings.isShowSettingsDrawer;

    const formatTheCode = (): void => {
        if (!refForEditorMirror.current) return;
        formatCode(refForEditorMirror.current, ParserOptions.GRAPH_QL);
    };

    const saveAsFavourite = (): void => {
        const value = refForEditorMirror.current?.getValue();
        if (!value) return;
        const newFavourites: Favourite[] = [
            ...(favourites || []),
            { id: new Date().getTime().toString(), name: value.substring(0, 24), typeDefs: value },
        ];
        setFavourites(newFavourites);
        Storage.storeJSON(LOCAL_STATE_FAVOURITES, newFavourites);
    };

    const setTypeDefsFromFavourite = (typeDefs: string) => {
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
                setError(error as GraphQLError);
            } finally {
                setLoading(false);
            }
        },
        [isDebugChecked, isCheckConstraintChecked, isCreateConstraintChecked, isRegexChecked]
    );

    const introspect = useCallback(async () => {
        try {
            setLoading(true);

            const sessionFactory = () =>
                auth?.driver?.session({ defaultAccessMode: neo4j.session.READ }) as neo4j.Session;

            const typeDefs = await toGraphQLTypeDefs(sessionFactory);

            refForEditorMirror.current?.setValue(typeDefs);
        } catch (error) {
            const msg = (error as GraphQLError).message;
            setError(msg);
        } finally {
            setLoading(false);
        }
    }, [buildSchema, refForEditorMirror.current]);

    const onSubmit = useCallback(() => {
        const value = refForEditorMirror.current?.getValue();
        if (value) {
            buildSchema(value);
        }
    }, [buildSchema]);

    return (
        <div className="w-full flex">
            <div className="h-content-container flex justify-start w-96 bg-white">
                <div className="p-6 w-full">
                    <SchemaSettings
                        isRegexChecked={isRegexChecked}
                        isDebugChecked={isDebugChecked}
                        isCheckConstraintChecked={isCheckConstraintChecked}
                        isCreateConstraintChecked={isCreateConstraintChecked}
                        setIsRegexChecked={setIsRegexChecked}
                        setIsDebugChecked={setIsDebugChecked}
                        setIsCheckConstraintChecked={setIsCheckConstraintChecked}
                        setIsCreateConstraintChecked={setIsCreateConstraintChecked}
                    />
                    <Favourites
                        favourites={favourites}
                        setFavourites={setFavourites}
                        onSelectFavourite={setTypeDefsFromFavourite}
                    />
                </div>
            </div>
            <div className="flex-1 flex justify-start w-full p-6" style={{ height: "87vh" }}>
                <div className="flex flex-col w-full h-full">
                    <ActionElementsBar
                        hasSchema={hasSchema}
                        loading={loading}
                        formatTheCode={formatTheCode}
                        onSubmit={onSubmit}
                        introspect={introspect}
                        saveAsFavorite={saveAsFavourite}
                    />
                    <SchemaErrorDisplay error={error} />
                    <SchemaEditor mirrorRef={refForEditorMirror} loading={loading} />
                </div>
            </div>
            {showRightPanel ? (
                <div className="h-content-container flex justify-start w-96 bg-white">
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
