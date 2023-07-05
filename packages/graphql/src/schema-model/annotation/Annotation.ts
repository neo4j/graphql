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
import { CypherAnnotation } from "./CypherAnnotation";
import { KeyAnnotation } from "./KeyAnnotation";
import { SubscriptionsAuthorizationAnnotation } from "./SubscriptionsAuthorizationAnnotation";

export type Annotation =
    | CypherAnnotation
    | AuthorizationAnnotation
    | AuthenticationAnnotation
    | KeyAnnotation
    | SubscriptionsAuthorizationAnnotation;

export enum AnnotationsKey {
    cypher = "cypher",
    authorization = "authorization",
    authentication = "authentication",
    key = "key",
    subscriptionsAuthorization = "subscriptionsAuthorization",
}

export type Annotations = {
    [AnnotationsKey.cypher]: CypherAnnotation;
    [AnnotationsKey.authorization]: AuthorizationAnnotation;
    [AnnotationsKey.authentication]: AuthenticationAnnotation;
    [AnnotationsKey.key]: KeyAnnotation;
    [AnnotationsKey.subscriptionsAuthorization]: SubscriptionsAuthorizationAnnotation;
};

export function annotationToKey(ann: Annotation): keyof Annotations {
    if (ann instanceof CypherAnnotation) return AnnotationsKey.cypher;
    if (ann instanceof AuthorizationAnnotation) return AnnotationsKey.authorization;
    if (ann instanceof AuthenticationAnnotation) return AnnotationsKey.authentication;
    if (ann instanceof KeyAnnotation) return AnnotationsKey.key;
    if (ann instanceof SubscriptionsAuthorizationAnnotation) return AnnotationsKey.subscriptionsAuthorization;
    throw new Error("annotation not known");
}
