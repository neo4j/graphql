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
import type { Annotations } from "./annotation/Annotation";
import type { DEPRECATED } from "../constants";
import { SHAREABLE } from "../constants";

const additionalDirectives = ["alias", "relationship", "relationshipProperties", "node", SHAREABLE] as const;

export type LibraryDirectives = keyof Annotations | (typeof additionalDirectives)[number] | typeof DEPRECATED;
const createDirectivesArray = <T extends readonly LibraryDirectives[]>(arr: T) => arr;

export const SCHEMA_CONFIGURATION_FIELD_DIRECTIVES = createDirectivesArray([
    "filterable",
    "selectable",
    "settable",
] as const);

export const FIELD_DIRECTIVES = createDirectivesArray([
    "alias",
    "authentication",
    "authorization",
    "coalesce",
    "customResolver",
    "cypher",
    "default",
    "id",
    "jwtClaim",
    "populatedBy",
    "relationship",
    "relayId",
    "subscriptionsAuthorization",
    "timestamp",
    "unique",
    ...SCHEMA_CONFIGURATION_FIELD_DIRECTIVES,
] as const);

export type FieldDirective = (typeof FIELD_DIRECTIVES)[number];
export const SCHEMA_CONFIGURATION_OBJECT_DIRECTIVES = createDirectivesArray([
    "query",
    "mutation",
    "subscription",
] as const);

export const OBJECT_DIRECTIVES = createDirectivesArray([
    "authentication",
    "authorization",
    "subscriptionsAuthorization",
    "plural",
    "limit",
    "fulltext",
    "node",
    "jwt",
    SHAREABLE,
    "deprecated",
    ...SCHEMA_CONFIGURATION_OBJECT_DIRECTIVES,
] as const);
export type ObjectDirective = (typeof OBJECT_DIRECTIVES)[number];

export const INTERFACE_DIRECTIVES = createDirectivesArray([
    "relationshipProperties",
    "query",
    "plural",
    "limit",
] as const);
export type InterfaceDirective = (typeof INTERFACE_DIRECTIVES)[number];

const UNION_DIRECTIVES = createDirectivesArray(["query", "plural"] as const);
export type UnionDirective = (typeof UNION_DIRECTIVES)[number];
