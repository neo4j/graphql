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
export const MIN_NEO4J_VERSION = "4.1.5";
export const MIN_APOC_VERSION = "4.1.0";
export const REQUIRED_APOC_FUNCTIONS = [
    "apoc.util.validatePredicate",
    "apoc.cypher.runFirstColumn",
    "apoc.coll.sortMulti",
    "apoc.date.convertFormat",
    "apoc.map.values",
];
export const REQUIRED_APOC_PROCEDURES = ["apoc.util.validate", "apoc.do.when", "apoc.cypher.doIt"];
export const DEBUG_AUTH = `${DEBUG_PREFIX}:auth`;
export const DEBUG_GRAPHQL = `${DEBUG_PREFIX}:graphql`;
export const DEBUG_EXECUTE = `${DEBUG_PREFIX}:execute`;

export const RESERVED_TYPE_NAMES = [
    {
        regex: /^PageInfo$/,
        error:
            "Type or Interface with name `PageInfo` reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.",
    },
    {
        regex: /^.+Connection$/,
        error:
            'Type or Interface with name ending "Connection" are reserved to support the pagination model of connections. See https://relay.dev/graphql/connections.htm#sec-Reserved-Types for more information.',
    },
    {
        regex: /^Node$/,
        error:
            "Type or Interface with name `Node` reserved to support Relay. See https://relay.dev/graphql/ for more information.",
    },
];

// [0]Field [1]Error
export const RESERVED_INTERFACE_FIELDS = [
    ["node", "Interface field name 'node' reserved to support relay See https://relay.dev/graphql/"],
    ["cursor", "Interface field name 'cursor' reserved to support relay See https://relay.dev/graphql/"],
];

export const WHERE_AGGREGATION_OPERATORS = ["EQUAL", "GT", "GTE", "LT", "LTE"];

// Types that you can average
// https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg
// https://neo4j.com/docs/cypher-manual/current/functions/aggregating/#functions-avg-duration
// String uses avg(size())
export const WHERE_AGGREGATION_AVERAGE_TYPES = ["String", "Int", "Float", "BigInt", "Duration"];

export const WHERE_AGGREGATION_TYPES = [
    "ID",
    "String",
    "Float",
    "Int",
    "BigInt",
    "DateTime",
    "LocalDateTime",
    "LocalTime",
    "Time",
    "Duration",
];
