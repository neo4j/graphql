/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */
import type { DEPRECATED } from "../constants";
import { SHAREABLE } from "../constants";
import type { ValueOf } from "../utils/value-of";
import type { Annotations } from "./annotation/Annotation";
import { annotationsParsers } from "./annotation/Annotation";

const additionalDirectives = [
    "alias",
    "relationship",
    "relationshipProperties",
    "declareRelationship",
    "node",
    SHAREABLE,
] as const;

type LibraryDirectives = keyof Annotations | ValueOf<typeof additionalDirectives> | typeof DEPRECATED;
export const LIBRARY_DIRECTIVES = [
    ...(Object.keys(annotationsParsers) as Array<keyof Annotations>)
        // fields from the @key directive is intentionally excluded as it is not in use by our schema model
        .filter((key) => key !== "key"),
    ...additionalDirectives,
] as const satisfies readonly LibraryDirectives[];

const SCHEMA_CONFIGURATION_FIELD_DIRECTIVES = [
    "filterable",
    "selectable",
    "settable",
    "sortable",
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
    "declareRelationship",
    ...SCHEMA_CONFIGURATION_FIELD_DIRECTIVES,
] as const satisfies readonly LibraryDirectives[];

export type FieldDirective = ValueOf<typeof FIELD_DIRECTIVES>;
export const SCHEMA_CONFIGURATION_OBJECT_DIRECTIVES = [
    "query",
    "mutation",
    "subscription",
] as const satisfies readonly LibraryDirectives[];

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const OBJECT_DIRECTIVES = [
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
    "relationshipProperties",
    "vector",
    ...SCHEMA_CONFIGURATION_OBJECT_DIRECTIVES,
] as const satisfies readonly LibraryDirectives[];
export type ObjectDirective = ValueOf<typeof OBJECT_DIRECTIVES>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const INTERFACE_DIRECTIVES = ["query", "plural", "limit"] as const satisfies readonly LibraryDirectives[];
export type InterfaceDirective = ValueOf<typeof INTERFACE_DIRECTIVES>;

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const UNION_DIRECTIVES = ["query", "plural"] as const satisfies readonly LibraryDirectives[];
export type UnionDirective = ValueOf<typeof UNION_DIRECTIVES>;
