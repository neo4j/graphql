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

import type {
    FieldDirective,
    InterfaceDirective,
    ObjectDirective,
    UnionDirective,
} from "../../../schema-model/library-directives";
import { FIELD_DIRECTIVES } from "../../../schema-model/library-directives";

type InvalidFieldCombinations = Record<FieldDirective, ReadonlyArray<FieldDirective | "private">>;

export const invalidFieldCombinations: InvalidFieldCombinations = {
    alias: ["jwtClaim", "cypher", "customResolver", "relationship"],
    authentication: ["jwtClaim", "customResolver", "relationship"],
    authorization: ["jwtClaim", "customResolver", "relationship"],
    coalesce: ["jwtClaim", "relationship"],
    customResolver: [
        "jwtClaim",
        "alias",
        "authentication",
        "authorization",
        "subscriptionsAuthorization",
        "id",
        "relationship",
        "unique",
        "filterable",
        "settable",
        "selectable",
    ],
    cypher: ["jwtClaim", "alias", "id", "relationship", "unique"],
    default: ["jwtClaim", "populatedBy", "relationship"],
    id: ["jwtClaim", "cypher", "populatedBy", "customResolver", "relationship", "timestamp"],
    populatedBy: ["jwtClaim", "id", "default", "relationship"],
    relationship: [
        "jwtClaim",
        "alias",
        "authentication",
        "authorization",
        "subscriptionsAuthorization",
        "coalesce",
        "cypher",
        "default",
        "id",
        "customResolver",
        "populatedBy",
        "unique",
    ],
    timestamp: ["jwtClaim", "id", "unique"],
    unique: ["jwtClaim", "cypher", "customResolver", "relationship", "timestamp"],
    jwtClaim: FIELD_DIRECTIVES,
    relayId: ["jwtClaim"],
    subscriptionsAuthorization: ["jwtClaim", "customResolver", "relationship"],
    selectable: ["jwtClaim", "customResolver"],
    settable: ["jwtClaim", "customResolver"],
    filterable: ["jwtClaim", "customResolver"],
    declareRelationship: ["jwtClaim"],
};

type InvalidInterfaceCombinations = Record<InterfaceDirective, ReadonlyArray<InterfaceDirective>>;

export const invalidInterfaceCombinations: InvalidInterfaceCombinations = {
    query: [],
    plural: [],
    limit: [],
};

type InvalidUnionCombinations = Record<UnionDirective, ReadonlyArray<UnionDirective>>;

export const invalidUnionCombinations: InvalidUnionCombinations = {
    query: [],
    plural: [],
};

type InvalidObjectCombinations = Record<Exclude<ObjectDirective, "jwt">, ReadonlyArray<ObjectDirective>>;

export const invalidObjectCombinations: InvalidObjectCombinations = {
    relationshipProperties: [],
    authentication: [],
    authorization: [],
    deprecated: [],
    fulltext: [],
    // jwt: OBJECT_DIRECTIVES, // This is deliberately commented out. JWT is a special case. We do different validations for jwt.
    mutation: [],
    node: [],
    plural: [],
    query: [],
    shareable: [],
    subscription: [],
    subscriptionsAuthorization: [],
    limit: [],
};
