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
import { TypeDefinitionsAnalyticsResults } from "./analytics";

export enum TrackingExecutionTypeExplorer {
    QUERY,
    MUTATION,
}

export enum TrackingSchemaConstraintTypes {
    CHECK,
    CREATE,
    NONE,
}

class Tracking {
    //
    // UX product usage tracking
    //
    public trackIntrospectionInSchemaView = () => {
        this.fireTrackingEvent("ux", "introspection-schema-view");
    };

    public trackIntrospectionInModal = () => {
        this.fireTrackingEvent("ux", "introspection-modal");
    };

    public trackChangeEditorTheme = () => {
        this.fireTrackingEvent("ux", "editor-theme");
    };

    public trackSaveFavorite = () => {
        this.fireTrackingEvent("ux", "save-favorite");
    };

    public trackSchemaDebugEnabled = () => {
        this.fireTrackingEvent("ux", "schema-debug-enabled");
    };

    public trackSchemaRegexEnabled = () => {
        this.fireTrackingEvent("ux", "schema-regex-enabled");
    };

    public trackSchemaConstraints = (constraintType: TrackingSchemaConstraintTypes) => {
        this.fireTrackingEvent("ux", "schema-constraints", { constraintType });
    };

    public trackChangeDatabase = () => {
        this.fireTrackingEvent("ux", "change-database");
    };

    public trackAddExecutionTypeInExplorer = (type: TrackingExecutionTypeExplorer) => {
        this.fireTrackingEvent("ux", "add-explorer-query-mutation", { type });
    };

    public trackOpenSchemaDocsDrawer = () => {
        this.fireTrackingEvent("ux", "open-schema-docs-drawer");
    };

    public trackOpenSchemaDocsExplorer = () => {
        this.fireTrackingEvent("ux", "open-schema-docs-explorer");
    };

    //
    // GraphQL metadata product usage tracking
    //
    public trackTypeDefinitionMetadata = (analytics: TypeDefinitionsAnalyticsResults) => {
        this.fireTrackingEvent("data", "type-definition-metadata", analytics);
    };

    public trackQueryComplexity = (complexity: number) => {
        this.fireTrackingEvent("data", "query-complexity", { complexity });
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
        window.analytics.track(`${eventCategory}-${eventLabel}`, enrichedEventProperties);
    };
}

export const tracking = new Tracking();
