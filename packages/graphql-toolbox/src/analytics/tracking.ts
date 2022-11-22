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

import { LOCAL_STATE_ENABLE_PRODUCT_USAGE_TRACKING } from "../constants";
import { Storage } from "../utils/storage";
import {
    TrackingTBBuildSchemaClick,
    TrackingTBCannyChangelogClick,
    TrackingTBChangeDatabase,
    TrackingTBEditorThemeToggle,
    TrackingTBExecuteQuery,
    TrackingTBExploreGraphQLaaSLinkClick,
    TrackingTBExplorerExecutionTypeAdd,
    TrackingTBFavorite,
    TrackingTBHelpLearnLinkClick,
    TrackingTBIntrospect,
    TrackingTBSchemaConstraints,
    TrackingTBSchemaDocsToggle,
    TrackingTBSchemaSettingsCheckbox,
} from "./tracking-types";
import { Screen } from "../contexts/screen";
import { Theme } from "../contexts/theme";

class Tracking {
    public trackDatabaseIntrospection = (properties: TrackingTBIntrospect) => {
        this.fireTrackingEvent("TB", "INTROSPECT", properties);
    };

    public trackChangeEditorTheme = (properties: TrackingTBEditorThemeToggle) => {
        const trackingThemeValue = properties.theme === Theme.DARK ? "dark" : "light";
        this.fireTrackingEvent("TB", "EDITOR_THEME_TOGGLE", { ...properties, theme: trackingThemeValue });
    };

    public trackSaveFavorite = (properties: TrackingTBFavorite) => {
        this.fireTrackingEvent("TB", "FAVORITE", properties);
    };

    public trackSchemaSettingsCheckbox = (properties: TrackingTBSchemaSettingsCheckbox) => {
        const actionValue = properties.action === "true" ? "check" : "uncheck";
        this.fireTrackingEvent("TB", "SCHEMA_SETTINGS_CHECKBOX", { ...properties, action: actionValue });
    };

    public trackSchemaConstraints = (properties: TrackingTBSchemaConstraints) => {
        this.fireTrackingEvent("TB", "SCHEMA_CONSTRAINTS_DROPDOWN", properties);
    };

    public trackChangeDatabase = (properties: TrackingTBChangeDatabase) => {
        this.fireTrackingEvent("TB", "CHANGE_DATABASE", properties);
    };

    public trackAddExecutionTypeInExplorer = (properties: TrackingTBExplorerExecutionTypeAdd) => {
        this.fireTrackingEvent("TB", "EXPLORER_EXECUTION_TYPE_ADD", properties);
    };

    public trackOpenSchemaDocs = (properties: TrackingTBSchemaDocsToggle) => {
        const screenValue = properties.screen === Screen.EDITOR ? "query editor" : "type definitions";
        const actionValue = properties.action ? "on" : "off";
        this.fireTrackingEvent("TB", "SCHEMA_DOCS_TOGGLE", { ...properties, screen: screenValue, action: actionValue });
    };

    public trackHelpLearnFeatureLinks = (properties: TrackingTBHelpLearnLinkClick) => {
        const screenValue = properties.screen === Screen.EDITOR ? "query editor" : "type definitions";
        this.fireTrackingEvent("TB", "HELP_LEARN_LINK_CLICK", { ...properties, screen: screenValue });
    };

    public trackBuildSchema = (properties: TrackingTBBuildSchemaClick) => {
        this.fireTrackingEvent("TB", "BUILD_SCHEMA_CLICK", properties);
    };

    public trackExecuteQuery = (properties: TrackingTBExecuteQuery) => {
        this.fireTrackingEvent("TB", "EXECUTE_QUERY", properties);
    };

    public trackExploreGraphQLaaSLink = (properties: TrackingTBExploreGraphQLaaSLinkClick) => {
        const screenValue = properties.screen === Screen.EDITOR ? "query editor" : "type definitions";
        this.fireTrackingEvent("TB", "EXPLORE_GRAPHQLAAS_LINK_CLICK", { ...properties, screen: screenValue });
    };

    public trackCannyChangelogLink = (properties: TrackingTBCannyChangelogClick) => {
        const screenValue = properties.screen === Screen.EDITOR ? "query editor" : "type definitions";
        this.fireTrackingEvent("TB", "CANNY_CHANGELOG_CLICK", { ...properties, screen: screenValue });
    };

    private fireTrackingEvent = (eventCategory: string, eventLabel: string, eventProperties = {}) => {
        const trackingConsent = Storage.retrieve(LOCAL_STATE_ENABLE_PRODUCT_USAGE_TRACKING);

        if (trackingConsent !== "true") return;
        if (!window.analytics || !window.analytics.track) return;

        const enrichedEventProperties = {
            ...eventProperties,
            graphQLToolboxVersion: process.env.VERSION,
            neo4jGraphQLLibraryVersion: process.env.NEO4J_GRAPHQL_VERSION,
        };
        window.analytics.track(`${eventCategory}_${eventLabel}`, enrichedEventProperties);
    };
}

export const tracking = new Tracking();
