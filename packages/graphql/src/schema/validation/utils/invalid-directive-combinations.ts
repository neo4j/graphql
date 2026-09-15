/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
        "filterable",
        "settable",
        "selectable",
        "sortable",
        "groupBy",
    ],
    cypher: ["alias", "id", "relationship"],
    default: ["jwtClaim", "populatedBy", "relationship"],
    id: ["jwtClaim", "cypher", "populatedBy", "customResolver", "relationship", "timestamp"],
    populatedBy: ["jwtClaim", "id", "default", "relationship", "groupBy"],
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
        "groupBy",
    ],
    timestamp: ["jwtClaim", "id"],
    jwtClaim: FIELD_DIRECTIVES.filter((directive) => directive !== "cypher"),
    relayId: ["jwtClaim"],
    subscriptionsAuthorization: ["jwtClaim", "customResolver", "relationship"],
    selectable: ["jwtClaim", "customResolver"],
    settable: ["jwtClaim", "customResolver"],
    filterable: ["jwtClaim", "customResolver"],
    sortable: ["jwtClaim", "customResolver"],
    declareRelationship: ["jwtClaim"],
    groupBy: ["customResolver", "jwtClaim", "relationship", "populatedBy"],
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
    relationshipProperties: [
        "vector",
        "authentication",
        "authorization",
        "node",
        "subscription",
        "subscriptionsAuthorization",
        "query",
        "mutation",
        "limit",
        "fulltext",
        "plural",
    ],
    authentication: ["relationshipProperties"],
    authorization: ["relationshipProperties"],
    deprecated: [],
    fulltext: ["relationshipProperties"],
    // jwt: OBJECT_DIRECTIVES, // This is deliberately commented out. JWT is a special case. We do different validations for jwt.
    mutation: ["relationshipProperties"],
    node: ["relationshipProperties"],
    plural: ["relationshipProperties"],
    query: ["relationshipProperties"],
    shareable: [],
    subscription: ["relationshipProperties"],
    subscriptionsAuthorization: ["relationshipProperties"],
    limit: ["relationshipProperties"],
    vector: ["relationshipProperties"],
};
