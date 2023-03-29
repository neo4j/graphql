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
import type { GridState } from "../modules/EditorView/grid/Grid";
import type { Favorite } from "../types";
import { ConstraintState } from "../types";
import { DEFAULT_TYPE_DEFS, DEFAULT_QUERY } from "./../constants";

export interface Store {
    typeDefinitions: string;
    lastQuery: string;
    lastParams: string;
    connectionUsername: string | null;
    connectionUrl: string | null;
    enableDebug: boolean;
    enableRegex: boolean;
    constraint: string | null;
    editorTheme: string | null;
    favorites: Favorite[] | null;
    showLintMarkers: boolean;
    hideIntrospectionPrompt: boolean;
    enableProductUsageTracking: boolean;
    hideProductUsageTrackingMessage: boolean;
    gridState: GridState | null;
    selectedDatabaseName: string | null;
    setTypeDefinitions: (typeDefinitions: string) => void;
    setLastQuery: (lastQuery: string) => void;
    setLastParams: (lastParams: string) => void;
    setConnectionUsername: (connectionUsername: string | null) => void;
    setConnectionUrl: (connectionUrl: string | null) => void;
    setEnableDebug: (enableDebug: boolean) => void;
    setEnableRegex: (enableRegex: boolean) => void;
    setConstraint: (constraint: string) => void;
    setEditorTheme: (editorTheme: string) => void;
    setFavorites: (favorites: Favorite[] | null) => void;
    setShowLintMarkers: (showLintMarkers: boolean) => void;
    setHideIntrospectionPrompt: (hideIntrospectionPrompt: boolean) => void;
    setEnableProductUsageTracking: (enableProductUsageTracking: boolean) => void;
    setHideProductUsageTrackingMessage: (hideProductUsageTrackingMessage: boolean) => void;
    setSelectedDatabaseName: (selectedDatabaseName: string) => void;
    setGridState: (gridState: GridState) => void;
}

const defaultValues = {
    typeDefinitions: DEFAULT_TYPE_DEFS,
    lastQuery: DEFAULT_QUERY,
    lastParams: "",
    connectionUsername: null,
    connectionUrl: null,
    enableDebug: false,
    enableRegex: false,
    constraint: ConstraintState.ignore.toString(),
    editorTheme: null,
    favorites: null,
    showLintMarkers: false,
    hideIntrospectionPrompt: false,
    enableProductUsageTracking: true,
    hideProductUsageTrackingMessage: false,
    selectedDatabaseName: null,
    gridState: null,
};

export const useStore = create<Store>()(
    //
    // TODO
    // - check all functionalities of zustand
    // - check how the migration works
    // - use, useState and setState?
    //
    persist(
        (set) => ({
            ...defaultValues,
            setTypeDefinitions: (typeDefinitions) => set({ typeDefinitions }),
            setLastQuery: (lastQuery) => set({ lastQuery }),
            setLastParams: (lastParams) => set({ lastParams }),
            setConnectionUsername: (connectionUsername) => set({ connectionUsername }),
            setConnectionUrl: (connectionUrl) => set({ connectionUrl }),
            setEnableDebug: (enableDebug) => set({ enableDebug }),
            setEnableRegex: (enableRegex) => set({ enableRegex }),
            setConstraint: (constraint) => set({ constraint }),
            setEditorTheme: (editorTheme) => set({ editorTheme }),
            setFavorites: (favorites) => set({ favorites }),
            setShowLintMarkers: (showLintMarkers) => set({ showLintMarkers }),
            setHideIntrospectionPrompt: (hideIntrospectionPrompt) => set({ hideIntrospectionPrompt }),
            setEnableProductUsageTracking: (enableProductUsageTracking) => set({ enableProductUsageTracking }),
            setHideProductUsageTrackingMessage: (hideProductUsageTrackingMessage) =>
                set({ hideProductUsageTrackingMessage }),
            setSelectedDatabaseName: (selectedDatabaseName) => set({ selectedDatabaseName }),
            setGridState: (gridState) => set({ gridState }),
        }),
        {
            name: "neo4j-graphql-toolbox", // a unique name
            version: 0, // explicitly setting the version
            storage: createJSONStorage(() => window.localStorage), // explicitly using localStorage
        }
    )
);
