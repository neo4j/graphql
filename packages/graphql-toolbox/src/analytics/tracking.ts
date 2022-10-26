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
    TrackingTBChangeDatabase,
    TrackingTBEditorThemeToggle,
    TrackingTBExecuteQuery,
    TrackingTBExplorerExecutionTypeAdd,
    TrackingTBFavorite,
    TrackingTBHelpLearnLinkClick,
    TrackingTBIntrospect,
    TrackingTBSchemaConstraints,
    TrackingTBSchemaDocsToggle,
    TrackingTBSchemaSettingsCheckbox,
} from "./tracking-types";

class Tracking {
    public trackDatabaseIntrospection = (properties: TrackingTBIntrospect) => {
        this.fireTrackingEvent("TB", "INTROSPECT", properties);
    };

    public trackChangeEditorTheme = (properties: TrackingTBEditorThemeToggle) => {
        this.fireTrackingEvent("TB", "EDITOR_THEME_TOGGLE", properties);
    };

    public trackSaveFavorite = (properties: TrackingTBFavorite) => {
        this.fireTrackingEvent("TB", "FAVORITE", properties);
    };

    public trackSchemaSettingsCheckbox = (properties: TrackingTBSchemaSettingsCheckbox) => {
        this.fireTrackingEvent("TB", "SCHEMA_SETTINGS_CHECKBOX", properties);
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
        this.fireTrackingEvent("TB", "SCHEMA_DOCS_TOGGLE", properties);
    };

    public trackHelpLearnFeatureLinks = (properties: TrackingTBHelpLearnLinkClick) => {
        this.fireTrackingEvent("TB", "HELP_LEARN_LINK_CLICK", properties);
    };

    public trackBuildSchema = (properties: TrackingTBBuildSchemaClick) => {
        this.fireTrackingEvent("TB", "BUILD_SCHEMA_CLICK", properties);
    };

    public trackExecuteQuery = (properties: TrackingTBExecuteQuery) => {
        this.fireTrackingEvent("TB", "EXECUTE_QUERY", properties);
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
