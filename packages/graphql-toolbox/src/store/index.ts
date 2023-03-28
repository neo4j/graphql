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
import { persist, createJSONStorage, devtools } from "zustand/middleware";

interface Store {
    typeDefinitions: string;
    lastQuery: string;
    lastParams: string;
    login: string;
    connectionUsername: string;
    connectionUrl: string;
    enableDebug: boolean;
    enableRegex: string; // still needed?
    checkConstraint: string;
    createConstraint: string;
    constraint: string;
    editorTheme: string;
    favorites: string[];
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
}

export const useStore = create<Store>()(
    devtools(
        persist(
            (set, get) => ({
                typeDefinitions: "",
                lastQuery: "",
                lastParams: "",
                login: "",
                connectionUsername: "",
                connectionUrl: "",
                enableDebug: false,
                enableRegex: "", // still needed?
                checkConstraint: "",
                createConstraint: "",
                constraint: "",
                editorTheme: "",
                favorites: [""],
                showLintMarkers: false,
                selectedDatabaseName: "",
                hideIntrospectionPrompt: false,
                gridState: [123],
                enableProductUsageTracking: false,
                hideProductUsageTrackingMessage: false,
                getTypeDefinitions: () => parseJson(get().typeDefinitions),
                setTypeDefinitions: (typeDefs) => set({ typeDefinitions: JSON.stringify(typeDefs) }),
                getLastQuery: () => parseJson(get().lastQuery),
                setLastQuery: (query) => set({ lastQuery: JSON.stringify(query) }),
                getLastParams: () => parseJson(get().lastParams),
                setLastParams: (params) => set({ lastParams: JSON.stringify(params) }),
            }),
            {
                name: "neo4j-graphql-toolbox",
                storage: createJSONStorage(() => window.localStorage),
            }
        )
    )
);

function parseJson(data: string): string | null {
    try {
        return JSON.parse(data) as string;
    } catch (error) {
        console.log("parseJson error: ", error);
        return null;
    }
}
