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

import { AuthenticationAnnotation } from "./AuthenticationAnnotation";
import { AuthorizationAnnotation } from "./AuthorizationAnnotation";
import { CoalesceAnnotation } from "./CoalesceAnnotation";
import { CustomResolverAnnotation } from "./CustomResolverAnnotation";
import { CypherAnnotation } from "./CypherAnnotation";
import { DefaultAnnotation } from "./DefaultAnnotation";
import { FilterableAnnotation } from "./FilterableAnnotation";
import { FullTextAnnotation } from "./FullTextAnnotation";
import { IDAnnotation } from "./IDAnnotation";
import { JWTClaimAnnotation } from "./JWTClaimAnnotation";
import { JWTPayloadAnnotation } from "./JWTPayloadAnnotation";
import { KeyAnnotation } from "./KeyAnnotation";
import { MutationAnnotation } from "./MutationAnnotation";
import { PluralAnnotation } from "./PluralAnnotation";
import { PopulatedByAnnotation } from "./PopulatedByAnnotation";
import { PrivateAnnotation } from "./PrivateAnnotation";
import { QueryAnnotation } from "./QueryAnnotation";
import { LimitAnnotation } from "./LimitAnnotation";
import { SelectableAnnotation } from "./SelectableAnnotation";
import { SettableAnnotation } from "./SettableAnnotation";
import { SubscriptionAnnotation } from "./SubscriptionAnnotation";
import { SubscriptionsAuthorizationAnnotation } from "./SubscriptionsAuthorizationAnnotation";
import { TimestampAnnotation } from "./TimestampAnnotation";
import { UniqueAnnotation } from "./UniqueAnnotation";

export type Annotation =
    | CypherAnnotation
    | AuthorizationAnnotation
    | AuthenticationAnnotation
    | KeyAnnotation
    | SubscriptionsAuthorizationAnnotation
    | LimitAnnotation
    | DefaultAnnotation
    | CoalesceAnnotation
    | CustomResolverAnnotation
    | IDAnnotation
    | MutationAnnotation
    | PluralAnnotation
    | FilterableAnnotation
    | FullTextAnnotation
    | PopulatedByAnnotation
    | QueryAnnotation
    | PrivateAnnotation
    | SelectableAnnotation
    | SettableAnnotation
    | TimestampAnnotation
    | UniqueAnnotation
    | SubscriptionAnnotation
    | JWTClaimAnnotation
    | JWTPayloadAnnotation;

export enum AnnotationsKey {
    authentication = "authentication",
    authorization = "authorization",
    coalesce = "coalesce",
    customResolver = "customResolver",
    cypher = "cypher",
    default = "default",
    filterable = "filterable",
    fulltext = "fulltext",
    id = "id",
    jwtClaim = "jwtClaim",
    jwtPayload = "jwtPayload",
    key = "key",
    limit = "limit",
    mutation = "mutation",
    plural = "plural",
    populatedBy = "populatedBy",
    private = "private",
    query = "query",
    selectable = "selectable",
    settable = "settable",
    subscription = "subscription",
    subscriptionsAuthorization = "subscriptionsAuthorization",
    timestamp = "timestamp",
    unique = "unique",
}

export type Annotations = {
    [AnnotationsKey.cypher]: CypherAnnotation;
    [AnnotationsKey.authorization]: AuthorizationAnnotation;
    [AnnotationsKey.authentication]: AuthenticationAnnotation;
    [AnnotationsKey.key]: KeyAnnotation;
    [AnnotationsKey.subscriptionsAuthorization]: SubscriptionsAuthorizationAnnotation;
    [AnnotationsKey.limit]: LimitAnnotation;
    [AnnotationsKey.default]: DefaultAnnotation;
    [AnnotationsKey.coalesce]: CoalesceAnnotation;
    [AnnotationsKey.customResolver]: CustomResolverAnnotation;
    [AnnotationsKey.id]: IDAnnotation;
    [AnnotationsKey.mutation]: MutationAnnotation;
    [AnnotationsKey.plural]: PluralAnnotation;
    [AnnotationsKey.filterable]: FilterableAnnotation;
    [AnnotationsKey.fulltext]: FullTextAnnotation;
    [AnnotationsKey.populatedBy]: PopulatedByAnnotation;
    [AnnotationsKey.query]: QueryAnnotation;
    [AnnotationsKey.private]: PrivateAnnotation;
    [AnnotationsKey.selectable]: SelectableAnnotation;
    [AnnotationsKey.settable]: SettableAnnotation;
    [AnnotationsKey.timestamp]: TimestampAnnotation;
    [AnnotationsKey.unique]: UniqueAnnotation;
    [AnnotationsKey.subscription]: SubscriptionAnnotation;
    [AnnotationsKey.jwtClaim]: JWTClaimAnnotation;
    [AnnotationsKey.jwtPayload]: JWTPayloadAnnotation;
};

export function annotationToKey(ann: Annotation): keyof Annotations {
    if (ann instanceof CypherAnnotation) return AnnotationsKey.cypher;
    if (ann instanceof AuthorizationAnnotation) return AnnotationsKey.authorization;
    if (ann instanceof AuthenticationAnnotation) return AnnotationsKey.authentication;
    if (ann instanceof KeyAnnotation) return AnnotationsKey.key;
    if (ann instanceof SubscriptionsAuthorizationAnnotation) return AnnotationsKey.subscriptionsAuthorization;
    if (ann instanceof LimitAnnotation) return AnnotationsKey.limit;
    if (ann instanceof DefaultAnnotation) return AnnotationsKey.default;
    if (ann instanceof CoalesceAnnotation) return AnnotationsKey.coalesce;
    if (ann instanceof CustomResolverAnnotation) return AnnotationsKey.customResolver;
    if (ann instanceof IDAnnotation) return AnnotationsKey.id;
    if (ann instanceof MutationAnnotation) return AnnotationsKey.mutation;
    if (ann instanceof PluralAnnotation) return AnnotationsKey.plural;
    if (ann instanceof FilterableAnnotation) return AnnotationsKey.filterable;
    if (ann instanceof FullTextAnnotation) return AnnotationsKey.fulltext;
    if (ann instanceof PopulatedByAnnotation) return AnnotationsKey.populatedBy;
    if (ann instanceof QueryAnnotation) return AnnotationsKey.query;
    if (ann instanceof PrivateAnnotation) return AnnotationsKey.private;
    if (ann instanceof SelectableAnnotation) return AnnotationsKey.selectable;
    if (ann instanceof SettableAnnotation) return AnnotationsKey.settable;
    if (ann instanceof TimestampAnnotation) return AnnotationsKey.timestamp;
    if (ann instanceof UniqueAnnotation) return AnnotationsKey.unique;
    if (ann instanceof SubscriptionAnnotation) return AnnotationsKey.subscription;
    if (ann instanceof JWTClaimAnnotation) return AnnotationsKey.jwtClaim;
    if (ann instanceof JWTPayloadAnnotation) return AnnotationsKey.jwtPayload;
    throw new Error("annotation not known");
}
