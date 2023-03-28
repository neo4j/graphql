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

export const LOCAL_STATE_SHOW_LINT_MARKERS = "neo4j.graphql.showLintMarkers";
export const LOCAL_STATE_SELECTED_DATABASE_NAME = "neo4j.graphql.selectedDatabaseName";
export const LOCAL_STATE_HIDE_INTROSPECTION_PROMPT = "neo4j.graphql.hideIntrospectionPrompt";
export const LOCAL_STATE_GRID_STATE = "neo4j.graphql.gridState";
export const LOCAL_STATE_ENABLE_PRODUCT_USAGE_TRACKING = "neo4j.graphql.enableProductUsageTracking";
export const LOCAL_STATE_HIDE_PRODUCT_USAGE_MESSAGE = "neo4j.graphql.hideProductUsageMessage";

export const SCHEMA_EDITOR_INPUT = "SCHEMA_EDITOR_INPUT";
export const EDITOR_QUERY_INPUT = "EDITOR_QUERY_INPUT";
export const EDITOR_PARAMS_INPUT = "EDITOR_PARAMS_INPUT";
export const EDITOR_RESPONSE_OUTPUT = "EDITOR_RESPONSE_OUTPUT";

export const VERIFY_CONNECTION_INTERVAL_MS = 30000;

export const THEME_EDITOR_LIGHT = "neo";
export const THEME_EDITOR_DARK = "dracula";

export const DEFAULT_TYPE_DEFS = `# Write your own type definition in the editor here or 
# generate it automatically from the current Neo4j database (introspection)

# Example type definition:
type Movie {
    title: String!
}
`;

export const DEFAULT_QUERY = `# Type queries into this side of the screen, and you will 
# see intelligent typeaheads aware of the current GraphQL type schema.
# Try the Explorer and use the Documentation

query {
    __typename
}
`;

export const DEFAULT_BOLT_URL = "bolt://localhost:7687";
export const DEFAULT_DATABASE_NAME = "neo4j";
export const DEFAULT_USERNAME = "neo4j";

export const CONNECT_URL_PARAM_NAME = "connectURL";
export const DATABASE_PARAM_NAME = "db";
