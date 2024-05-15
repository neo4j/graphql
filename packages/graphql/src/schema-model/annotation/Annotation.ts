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

import type { DirectiveNode } from "graphql";
import { parseAuthenticationAnnotation } from "../parser/annotations-parser/authentication-annotation";
import { parseAuthorizationAnnotation } from "../parser/annotations-parser/authorization-annotation";
import { parseCoalesceAnnotation } from "../parser/annotations-parser/coalesce-annotation";
import { parseCustomResolverAnnotation } from "../parser/annotations-parser/custom-resolver-annotation";
import { parseCypherAnnotation } from "../parser/annotations-parser/cypher-annotation";
import { parseDefaultAnnotation } from "../parser/annotations-parser/default-annotation";
import { parseFilterableAnnotation } from "../parser/annotations-parser/filterable-annotation";
import { parseFullTextAnnotation } from "../parser/annotations-parser/full-text-annotation";
import { parseJWTClaimAnnotation } from "../parser/annotations-parser/jwt-claim-annotation";
import { parseKeyAnnotation } from "../parser/annotations-parser/key-annotation";
import { parseLimitAnnotation } from "../parser/annotations-parser/limit-annotation";
import { parseMutationAnnotation } from "../parser/annotations-parser/mutation-annotation";
import { parsePluralAnnotation } from "../parser/annotations-parser/plural-annotation";
import { parsePopulatedByAnnotation } from "../parser/annotations-parser/populated-by-annotation";
import { parseQueryAnnotation } from "../parser/annotations-parser/query-annotation";
import { parseSelectableAnnotation } from "../parser/annotations-parser/selectable-annotation";
import { parseSettableAnnotation } from "../parser/annotations-parser/settable-annotation";
import { parseSubscriptionAnnotation } from "../parser/annotations-parser/subscription-annotation";
import { parseSubscriptionsAuthorizationAnnotation } from "../parser/annotations-parser/subscriptions-authorization-annotation";
import { parseTimestampAnnotation } from "../parser/annotations-parser/timestamp-annotation";
import { parseUniqueAnnotation } from "../parser/annotations-parser/unique-annotation";
import { parseVectorAnnotation } from "../parser/annotations-parser/vector-annotation";
import type { AuthenticationAnnotation } from "./AuthenticationAnnotation";
import type { AuthorizationAnnotation } from "./AuthorizationAnnotation";
import type { CoalesceAnnotation } from "./CoalesceAnnotation";
import type { CustomResolverAnnotation } from "./CustomResolverAnnotation";
import type { CypherAnnotation } from "./CypherAnnotation";
import type { DefaultAnnotation } from "./DefaultAnnotation";
import type { FilterableAnnotation } from "./FilterableAnnotation";
import type { FullTextAnnotation } from "./FullTextAnnotation";
import { IDAnnotation } from "./IDAnnotation";
import type { JWTClaimAnnotation } from "./JWTClaimAnnotation";
import { JWTPayloadAnnotation } from "./JWTPayloadAnnotation";
import type { KeyAnnotation } from "./KeyAnnotation";
import type { LimitAnnotation } from "./LimitAnnotation";
import type { MutationAnnotation } from "./MutationAnnotation";
import type { PluralAnnotation } from "./PluralAnnotation";
import type { PopulatedByAnnotation } from "./PopulatedByAnnotation";
import { PrivateAnnotation } from "./PrivateAnnotation";
import type { QueryAnnotation } from "./QueryAnnotation";
import { RelayIDAnnotation } from "./RelayIDAnnotation";
import type { SelectableAnnotation } from "./SelectableAnnotation";
import type { SettableAnnotation } from "./SettableAnnotation";
import type { SubscriptionAnnotation } from "./SubscriptionAnnotation";
import type { SubscriptionsAuthorizationAnnotation } from "./SubscriptionsAuthorizationAnnotation";
import type { TimestampAnnotation } from "./TimestampAnnotation";
import type { UniqueAnnotation } from "./UniqueAnnotation";
import type { VectorAnnotation } from "./VectorAnnotation";

export interface Annotation {
    readonly name: string;
}

// Ensures that annotation name property matches its Annotations object key
type CheckAnnotationName<T> = {
    [P in keyof T]: T[P] & { name: P };
};

export type Annotations = CheckAnnotationName<{
    authentication: AuthenticationAnnotation;
    authorization: AuthorizationAnnotation;
    coalesce: CoalesceAnnotation;
    customResolver: CustomResolverAnnotation;
    cypher: CypherAnnotation;
    default: DefaultAnnotation;
    filterable: FilterableAnnotation;
    fulltext: FullTextAnnotation;
    vector: VectorAnnotation;
    id: IDAnnotation;
    jwt: JWTPayloadAnnotation;
    jwtClaim: JWTClaimAnnotation;
    key: KeyAnnotation;
    limit: LimitAnnotation;
    mutation: MutationAnnotation;
    plural: PluralAnnotation;
    populatedBy: PopulatedByAnnotation;
    private: PrivateAnnotation;
    query: QueryAnnotation;
    relayId: RelayIDAnnotation;
    selectable: SelectableAnnotation;
    settable: SettableAnnotation;
    subscription: SubscriptionAnnotation;
    subscriptionsAuthorization: SubscriptionsAuthorizationAnnotation;
    timestamp: TimestampAnnotation;
    unique: UniqueAnnotation;
}>;

export type AnnotationParser<T extends Annotation> = (
    firstDirective: DirectiveNode,
    directives: readonly DirectiveNode[]
) => T;

export const annotationsParsers: { [key in keyof Annotations]: AnnotationParser<Annotations[key]> } = {
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
    jwt: () => new JWTPayloadAnnotation(),
    key: parseKeyAnnotation,
    mutation: parseMutationAnnotation,
    plural: parsePluralAnnotation,
    populatedBy: parsePopulatedByAnnotation,
    private: () => new PrivateAnnotation(),
    query: parseQueryAnnotation,
    limit: parseLimitAnnotation,
    selectable: parseSelectableAnnotation,
    settable: parseSettableAnnotation,
    subscription: parseSubscriptionAnnotation,
    subscriptionsAuthorization: parseSubscriptionsAuthorizationAnnotation,
    timestamp: parseTimestampAnnotation,
    unique: parseUniqueAnnotation,
    relayId: () => new RelayIDAnnotation(),
    vector: parseVectorAnnotation,
};
