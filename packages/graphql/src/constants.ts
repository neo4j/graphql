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

const DEBUG_PREFIX = "@neo4j/graphql";

export const AUTH_FORBIDDEN_ERROR = "@neo4j/graphql/FORBIDDEN";
export const AUTH_UNAUTHENTICATED_ERROR = "@neo4j/graphql/UNAUTHENTICATED";
export const MIN_NEO4J_VERSION = "4.4";
export const REQUIRED_APOC_FUNCTIONS = ["apoc.util.validatePredicate", "apoc.date.convertFormat"];
export const AUTHORIZATION_UNAUTHENTICATED = "Unauthenticated";
export const DEBUG_ALL = `${DEBUG_PREFIX}:*`;
export const DEBUG_AUTH = `${DEBUG_PREFIX}:auth`;
export const DEBUG_EXECUTE = `${DEBUG_PREFIX}:execution`;
export const DEBUG_GENERATE = `${DEBUG_PREFIX}:generate`;
export const DEBUG_GRAPHQL = `${DEBUG_PREFIX}:graphql`;
export const DEBUG_TRANSLATE = `${DEBUG_PREFIX}:translate`;

export const RELATIONSHIP_REQUIREMENT_PREFIX = "@neo4j/graphql/RELATIONSHIP-REQUIRED";

export const RESERVED_TYPE_NAMES = [
    {
        regex: /^PageInfo$/,
        error: "Type or Interface with name `PageInfo` reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.",
    },
    {
        regex: /^.+Connection$/,
        error: 'Type or Interface with name ending "Connection" are reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.',
    },
    {
        regex: /^Node$/,
        error: "Type or Interface with name `Node` reserved to support Relay. See https://relay.dev/graphql/ for more information.",
    },
];

// [0]Field [1]Error
export const RESERVED_INTERFACE_FIELDS = [
    ["node", "Interface field name 'node' reserved to support relay See https://relay.dev/graphql/"],
    ["cursor", "Interface field name 'cursor' reserved to support relay See https://relay.dev/graphql/"],
];

export const GRAPHQL_BUILTIN_SCALAR_TYPES = ["Boolean", "ID", "String", "Int", "Float"];
export const TEMPORAL_SCALAR_TYPES = ["DateTime", "LocalDateTime", "Time", "LocalTime", "Date"];
export const SCALAR_TYPES = [...GRAPHQL_BUILTIN_SCALAR_TYPES, ...TEMPORAL_SCALAR_TYPES, "BigInt", "Duration"];
export const SPATIAL_TYPES = ["Point", "CartesianPoint"];

export function isTemporal(typeName: string) {
    return TEMPORAL_SCALAR_TYPES.includes(typeName);
}

export function isSpatial(typeName: string) {
    return SPATIAL_TYPES.includes(typeName);
}

export const LOGICAL_OPERATORS = ["AND", "OR", "NOT"] as const;

// aggregation
export const AGGREGATION_COMPARISON_OPERATORS = ["EQUAL", "GT", "GTE", "LT", "LTE"] as const;

export enum RelationshipQueryDirectionOption {
    DEFAULT_DIRECTED = "DEFAULT_DIRECTED",
    DEFAULT_UNDIRECTED = "DEFAULT_UNDIRECTED",
    DIRECTED_ONLY = "DIRECTED_ONLY",
    UNDIRECTED_ONLY = "UNDIRECTED_ONLY",
}

export enum RelationshipNestedOperationsOption {
    CREATE = "CREATE",
    UPDATE = "UPDATE",
    DELETE = "DELETE",
    CONNECT = "CONNECT",
    DISCONNECT = "DISCONNECT",
    CONNECT_OR_CREATE = "CONNECT_OR_CREATE",
}

export const META_CYPHER_VARIABLE = "meta";
export const META_OLD_PROPS_CYPHER_VARIABLE = "oldProps";

export const DBMS_COMPONENTS_QUERY =
    "CALL dbms.components() YIELD versions, edition UNWIND versions AS version RETURN version, edition";

export const DEPRECATED = "deprecated";
export const SHAREABLE = "shareable";
export const PROPAGATED_DIRECTIVES = [SHAREABLE, DEPRECATED] as const;
export const SCORE_FIELD = "score";
