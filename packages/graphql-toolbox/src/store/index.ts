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

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { Favorite } from "../types";
import { DEFAULT_TYPE_DEFS, DEFAULT_QUERY } from "./../constants";

export interface Store {
    typeDefinitions: string;
    lastQuery: string;
    lastParams: string;
    connectionUsername: string | null;
    connectionUrl: string | null;
    enableDebug: boolean;
    enableRegex: boolean; // still needed?
    constraint: string | null;
    editorTheme: string | null;
    favorites: Favorite[] | null;
    showLintMarkers: boolean;
    selectedDatabaseName: string;
    hideIntrospectionPrompt: boolean;
    gridState: number[];
    enableProductUsageTracking: boolean;
    hideProductUsageTrackingMessage: boolean;
    getTypeDefinitions: () => string | null;
    setTypeDefinitions: (typeDefs: string) => void;
    getLastQuery: () => string | null;
    setLastQuery: (query: string) => void;
    getLastParams: () => string | null;
    setLastParams: (params: string) => void;
    setConnectionUsername: (username: string | null) => void;
    setConnectionUrl: (url: string | null) => void;
    setEnableDebug: (isDebug: boolean) => void;
    setEnableRegex: (isRegex: boolean) => void;
    setConstraint: (constraint: string) => void;
    setEditorTheme: (theme: string) => void;
    setFavorites: (favorites: Favorite[] | null) => void;
}

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            typeDefinitions: DEFAULT_TYPE_DEFS,
            lastQuery: DEFAULT_QUERY,
            lastParams: "",
            connectionUsername: null,
            connectionUrl: null,
            enableDebug: false,
            enableRegex: false, // still needed?
            constraint: null,
            editorTheme: null,
            favorites: null,
            showLintMarkers: false,
            selectedDatabaseName: "",
            hideIntrospectionPrompt: false,
            gridState: [123],
            enableProductUsageTracking: false,
            hideProductUsageTrackingMessage: false,
            getTypeDefinitions: () => parseJson(get().typeDefinitions), // TODO: need to JSON stringify? probably not!
            setTypeDefinitions: (typeDefs) => set({ typeDefinitions: JSON.stringify(typeDefs) }),
            getLastQuery: () => parseJson(get().lastQuery),
            setLastQuery: (query) => set({ lastQuery: JSON.stringify(query) }),
            getLastParams: () => parseJson(get().lastParams),
            setLastParams: (params) => set({ lastParams: JSON.stringify(params) }),
            setConnectionUsername: (username) => set({ connectionUsername: username }),
            setConnectionUrl: (url) => set({ connectionUrl: url }),
            setEnableDebug: (isDebug) => set({ enableDebug: isDebug }),
            setEnableRegex: (isRegex) => set({ enableRegex: isRegex }),
            setConstraint: (constraint) => set({ constraint }),
            setEditorTheme: (theme) => set({ editorTheme: theme }),
            setFavorites: (favorites: Favorite[] | null) => set({ favorites }),
        }),
        {
            name: "neo4j-graphql-toolbox",
            storage: createJSONStorage(() => window.localStorage),
        }
    )
);

function parseJson(data: string): any | null {
    try {
        return JSON.parse(data) as string;
    } catch (error) {
        console.log("parseJson error: ", error);
        return null;
    }
}
