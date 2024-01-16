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

import { IDAnnotation } from "./IDAnnotation";
import { RelayIDAnnotation } from "./RelayIDAnnotation";
import { parseCypherAnnotation } from "../parser/annotations-parser/cypher-annotation";
import { parseAuthorizationAnnotation } from "../parser/annotations-parser/authorization-annotation";
import { parseAuthenticationAnnotation } from "../parser/annotations-parser/authentication-annotation";
import { parseCoalesceAnnotation } from "../parser/annotations-parser/coalesce-annotation";
import { parseCustomResolverAnnotation } from "../parser/annotations-parser/custom-resolver-annotation";
import { parseDefaultAnnotation } from "../parser/annotations-parser/default-annotation";
import { parseFilterableAnnotation } from "../parser/annotations-parser/filterable-annotation";
import { parseFullTextAnnotation } from "../parser/annotations-parser/full-text-annotation";
import { parseJWTClaimAnnotation } from "../parser/annotations-parser/jwt-claim-annotation";
import { parseJWTPayloadAnnotation } from "../parser/annotations-parser/jwt-payload-annotation";
import { parseMutationAnnotation } from "../parser/annotations-parser/mutation-annotation";
import { parsePluralAnnotation } from "../parser/annotations-parser/plural-annotation";
import { parsePopulatedByAnnotation } from "../parser/annotations-parser/populated-by-annotation";
import { parsePrivateAnnotation } from "../parser/annotations-parser/private-annotation";
import { parseQueryAnnotation } from "../parser/annotations-parser/query-annotation";
import { parseLimitAnnotation } from "../parser/annotations-parser/limit-annotation";
import { parseSelectableAnnotation } from "../parser/annotations-parser/selectable-annotation";
import { parseSettableAnnotation } from "../parser/annotations-parser/settable-annotation";
import { parseSubscriptionAnnotation } from "../parser/annotations-parser/subscription-annotation";
import { parseSubscriptionsAuthorizationAnnotation } from "../parser/annotations-parser/subscriptions-authorization-annotation";
import { parseTimestampAnnotation } from "../parser/annotations-parser/timestamp-annotation";
import { parseUniqueAnnotation } from "../parser/annotations-parser/unique-annotation";
import type { DirectiveNode } from "graphql";
import { parseKeyAnnotation } from "../parser/annotations-parser/key-annotation";

export interface Annotation {
    readonly name: string;
}

export const annotationsParsers = {
    authentication: parseAuthenticationAnnotation,
    authorization: parseAuthorizationAnnotation,
    coalesce: parseCoalesceAnnotation,
    customResolver: parseCustomResolverAnnotation,
    cypher: parseCypherAnnotation,
    default: parseDefaultAnnotation,
    filterable: parseFilterableAnnotation,
    fulltext: parseFullTextAnnotation,
    id: () => new IDAnnotation(),
    jwtClaim: parseJWTClaimAnnotation,
    jwt: parseJWTPayloadAnnotation,
    key: parseKeyAnnotation,
    mutation: parseMutationAnnotation,
    plural: parsePluralAnnotation,
    populatedBy: parsePopulatedByAnnotation,
    private: parsePrivateAnnotation,
    query: parseQueryAnnotation,
    limit: parseLimitAnnotation,
    selectable: parseSelectableAnnotation,
    settable: parseSettableAnnotation,
    subscription: parseSubscriptionAnnotation,
    subscriptionsAuthorization: parseSubscriptionsAuthorizationAnnotation,
    timestamp: parseTimestampAnnotation,
    unique: parseUniqueAnnotation,
    relayId: () => new RelayIDAnnotation(),
};

// Define a mapped type to enforce the constraint
type AnnotationsParsers = {
    [K in keyof typeof annotationsParsers]: (
        first: DirectiveNode,
        allDirectives: ReadonlyArray<DirectiveNode>
    ) => {
        name: K;
    } & Annotation;
};

/*
 Keep this for type checking!
 We cannot directly assign the type `AnnotationsParsers` to the const `annotationsParsers`
 because this will create a circular reference for type resolution.
*/
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const typeCheckingForAnnotationsParsers: AnnotationsParsers = annotationsParsers;

export type Annotations = {
    [P in keyof typeof annotationsParsers]?: ReturnType<(typeof annotationsParsers)[P]>;
};
