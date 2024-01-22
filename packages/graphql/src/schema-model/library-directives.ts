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
import type { ValueOf } from "../utils/value-of";

const additionalDirectives = ["alias", "relationship", "relationshipProperties", "node", SHAREABLE] as const;

export type LibraryDirectives = keyof Annotations | ValueOf<typeof additionalDirectives> | typeof DEPRECATED;
export const SCHEMA_CONFIGURATION_FIELD_DIRECTIVES = [
    "filterable",
    "selectable",
    "settable",
] as const satisfies readonly LibraryDirectives[];

export const FIELD_DIRECTIVES = [
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
] as const satisfies readonly LibraryDirectives[];

export type FieldDirective = ValueOf<typeof FIELD_DIRECTIVES>;
export const SCHEMA_CONFIGURATION_OBJECT_DIRECTIVES = [
    "query",
    "mutation",
    "subscription",
] as const satisfies readonly LibraryDirectives[];

export const OBJECT_DIRECTIVES = [
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
] as const satisfies readonly LibraryDirectives[];
export type ObjectDirective = ValueOf<typeof OBJECT_DIRECTIVES>;

export const INTERFACE_DIRECTIVES = [
    "relationshipProperties",
    "query",
    "plural",
    "limit",
] as const satisfies readonly LibraryDirectives[];
export type InterfaceDirective = ValueOf<typeof INTERFACE_DIRECTIVES>;

const UNION_DIRECTIVES = ["query", "plural"] as const satisfies readonly LibraryDirectives[];
export type UnionDirective = ValueOf<typeof UNION_DIRECTIVES>;
