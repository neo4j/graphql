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

import type { FieldDirective, InterfaceDirective, ObjectDirective } from "../../../constants";
import { FIELD_DIRECTIVES } from "../../../constants";

type InvalidFieldCombinations = Record<FieldDirective, ReadonlyArray<FieldDirective | "private">>;

export const invalidFieldCombinations: InvalidFieldCombinations = {
    alias: ["cypher", "customResolver", "relationship"],
    authentication: ["customResolver", "relationship"],
    authorization: ["customResolver", "relationship"],
    callback: ["id", "default", "relationship"],
    coalesce: ["relationship"],
    customResolver: [
        "alias",
        "authentication",
        "authorization",
        "subscriptionsAuthorization",
        "id",
        "readonly",
        "relationship",
        "unique",
        "writeonly",
    ],
    cypher: ["alias", "id", "readonly", "relationship", "unique", "writeonly"],
    default: ["callback", "populatedBy", "relationship"],
    id: ["cypher", "populatedBy", "callback", "customResolver", "relationship", "timestamp"],
    populatedBy: ["id", "default", "relationship"],
    readonly: ["cypher", "customResolver", "relationship"],
    relationship: [
        "alias",
        "authentication",
        "authorization",
        "subscriptionsAuthorization",
        "callback",
        "coalesce",
        "cypher",
        "default",
        "id",
        "customResolver",
        "readonly",
        "populatedBy",
        "unique",
    ],
    timestamp: ["id", "unique"],
    unique: ["cypher", "customResolver", "relationship", "timestamp"],
    writeonly: ["cypher", "customResolver"],
    jwtClaim: FIELD_DIRECTIVES,
    relayId: ["jwtClaim"],
    subscriptionsAuthorization: ["customResolver", "relationship"],
    selectable: ["customResolver"],
    settable: ["customResolver"],
    filterable: ["customResolver"],
};

type InvalidInterfaceCombinations = Record<InterfaceDirective, ReadonlyArray<InterfaceDirective>>;

export const invalidInterfaceCombinations: InvalidInterfaceCombinations = {
    relationshipProperties: [],
};

type InvalidObjectCombinations = Record<Exclude<ObjectDirective, "jwt">, ReadonlyArray<ObjectDirective>>;

export const invalidObjectCombinations: InvalidObjectCombinations = {
    authentication: [],
    authorization: [],
    deprecated: [],
    fulltext: [],
    // jwt: OBJECT_DIRECTIVES, // This is deliberately commented out. JWT is a special case. We do different validations for jwt.
    mutation: [],
    node: [],
    plural: [],
    query: [],
    queryOptions: [],
    shareable: [],
    subscription: [],
    subscriptionsAuthorization: [],
};
