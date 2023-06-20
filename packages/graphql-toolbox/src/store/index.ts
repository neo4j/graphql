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
import { createJSONStorage, persist } from "zustand/middleware";
import type { EditorTab, Favorite } from "../types";
import { ConstraintState } from "../types";
import { DEFAULT_QUERY, DEFAULT_TYPE_DEFS } from "./../constants";
import { getQueryOrMutationName } from "./utils";

export interface Store {
    typeDefinitions: string;
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
    selectedDatabaseName: string | null;
    setConnectionUsername: (connectionUsername: string | null) => void;
    setConnectionUrl: (connectionUrl: string | null) => void;
    setHideIntrospectionPrompt: (hideIntrospectionPrompt: boolean) => void;
    setSelectedDatabaseName: (selectedDatabaseName: string) => void;
    tabs: EditorTab[];
    activeTabIndex: number;
    addTab: () => void;
    closeTab: (index: number) => void;
    getActiveTab: () => EditorTab;
    changeActiveTabIndex: (index: number) => void;
    updateQuery: (query: string, updatedTabIndex: number) => void;
    updateVariables: (variables: string, updatedTabIndex: number) => void;
    updateResponse: (response: string, updatedTabIndex: number) => void;
}

const defaultValues = {
    typeDefinitions: DEFAULT_TYPE_DEFS,
    connectionUsername: null,
    connectionUrl: null,
    enableDebug: false,
    enableRegex: false,
    constraint: ConstraintState.ignore.toString(),
    editorTheme: null,
    favorites: [],
    showLintMarkers: false,
    hideIntrospectionPrompt: false,
    enableProductUsageTracking: true,
    hideProductUsageTrackingMessage: false,
    selectedDatabaseName: null,
    tabs: [
        {
            title: "Unnamed",
            query: DEFAULT_QUERY,
            variables: "",
            response: "",
            headers: [],
        },
    ],
    activeTabIndex: 0,
};

export const useStore = create<Store>()(
    persist(
        (set, get) => ({
            ...defaultValues,
            setConnectionUsername: (connectionUsername) => set({ connectionUsername }),
            setConnectionUrl: (connectionUrl) => set({ connectionUrl }),
            setHideIntrospectionPrompt: (hideIntrospectionPrompt) => set({ hideIntrospectionPrompt }),
            setSelectedDatabaseName: (selectedDatabaseName) => set({ selectedDatabaseName }),
            addTab: () => {
                const currentTabs = get().tabs;
                const newTab: EditorTab = {
                    title: "Unnamed",
                    query: "",
                    variables: " ", // explicitly set to non-empty
                    response: " ", // explicitly set to non-empty
                    headers: [],
                };
                set({
                    tabs: [...currentTabs, newTab],
                    activeTabIndex: currentTabs.length,
                });
            },
            closeTab: (index) => {
                const currentTabs = get().tabs;
                if (currentTabs.length <= 1) {
                    return;
                }
                const isClosedTabActiveTab = get().activeTabIndex === index;
                let nextActiveTabIdx = index - 1;
                if (index === 0) {
                    nextActiveTabIdx = 0;
                } else if (isClosedTabActiveTab) {
                    nextActiveTabIdx = get().activeTabIndex - 1;
                }
                set({
                    tabs: currentTabs.filter((_, idx) => idx !== index),
                    activeTabIndex: nextActiveTabIdx,
                });
            },
            getActiveTab: () => get().tabs[get().activeTabIndex],
            changeActiveTabIndex: (index) => set({ activeTabIndex: index }),
            updateQuery: (query: string, updatedTabIndex: number) => {
                const title = getQueryOrMutationName(query);
                set({
                    tabs: [...get().tabs.map((tab, idx) => (idx === updatedTabIndex ? { ...tab, query, title } : tab))],
                });
            },
            updateVariables: (variables: string, updatedTabIndex: number) =>
                set({
                    tabs: [...get().tabs.map((tab, idx) => (idx === updatedTabIndex ? { ...tab, variables } : tab))],
                }),
            updateResponse: (response: string, updatedTabIndex: number) =>
                set({
                    tabs: [...get().tabs.map((tab, idx) => (idx === updatedTabIndex ? { ...tab, response } : tab))],
                }),
        }),
        {
            name: "neo4j-graphql-toolbox", // a unique name
            version: 0, // explicitly setting the version
            storage: createJSONStorage(() => window.localStorage), // explicitly using localStorage
        }
    )
);
