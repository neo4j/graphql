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

export const LOCAL_STATE_TYPE_DEFS = "neo4j.graphql.typeDefs";
export const LOCAL_STATE_OPTIONS = "neo4j.graphql.options";
export const LOCAL_STATE_TYPE_LAST_QUERY = "neo4j.graphql.lastQuery";
export const LOCAL_STATE_TYPE_LAST_PARAMS = "neo4j.graphql.lastParams";
export const LOCAL_STATE_LOGIN = "neo4j.graphql.login";
export const LOCAL_STATE_DEBUG = "neo4j.graphql.debug";
export const LOCAL_STATE_CHECK_CONSTRAINT = "neo4j.graphql.checkConstraint";
export const LOCAL_STATE_CREATE_CONSTRAINT = "neo4j.graphql.createConstraint";
export const LOCAL_STATE_EDITOR_THEME = "neo4j.graphql.editorTheme";
export const LOCAL_STATE_ENABLE_REGEX = "neo4j.graphql.enable.regex";

export const LOGIN_USERNAME_INPUT = "LOGIN_USERNAME_INPUT";
export const LOGIN_PASSWORD_INPUT = "LOGIN_PASSWORD_INPUT";
export const LOGIN_URL_INPUT = "LOGIN_URL_INPUT";
export const LOGIN_BUTTON = "LOGIN_BUTTON";

export const SCHEMA_EDITOR_INPUT = "SCHEMA_EDITOR_INPUT";
export const SCHEMA_EDITOR_BUILD_BUTTON = "SCHEMA_EDITOR_BUILD_BUTTON";
export const SCHEMA_EDITOR_PRETTY_BUTTON = "SCHEMA_EDITOR_PRETTY_BUTTON";
export const SCHEMA_EDITOR_INTROSPECT_BUTTON = "SCHEMA_EDITOR_INTROSPECT_BUTTON";

export const EDITOR_QUERY_INPUT = "EDITOR_QUERY_INPUT";
export const EDITOR_PARAMS_INPUT = "EDITOR_PARAMS_INPUT";
export const EDITOR_RESPONSE_OUTPUT = "EDITOR_RESPONSE_OUTPUT";
export const EDITOR_QUERY_BUTTON = "EDITOR_QUERY_BUTTON";

export const VERIFY_CONNECTION_INTERVAL_MS = 30000;

export const THEME_EDITOR_LIGHT = "neo";
export const THEME_EDITOR_DARK = "dracula";

export const DEFAULT_TYPE_DEFS = `
# Write your own type definition in the editor here or 
# generate it automatically from the current Neo4j database (introspection)

# Example type definition:
type Movie {
    title: String!
}
`;

export const DEFAULT_QUERY = `
# Type queries into this side of the screen, and you will 
# see intelligent typeaheads aware of the current GraphQL type schema.
# Try the Explorer and use the Documentation

query {
    __typename
}
`;

export const DEFAULT_BOLT_URL = "bolt://localhost:7687";
