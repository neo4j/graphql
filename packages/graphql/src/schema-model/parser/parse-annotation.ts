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
import { parseCoalesceAnnotation } from "./annotations-parser/coalesce-annotation";
import { parseCypherAnnotation } from "./annotations-parser/cypher-annotation";
import { parseCustomResolverAnnotation } from "./annotations-parser/custom-resolver-annotation";
import { parseDefaultAnnotation } from "./annotations-parser/default-annotation";
import { parseFilterableAnnotation } from "./annotations-parser/filterable-annotation";
import { parseMutationAnnotation } from "./annotations-parser/mutation-annotation";
import { parsePluralAnnotation } from "./annotations-parser/plural-annotation";
import { parsePopulatedByAnnotation } from "./annotations-parser/populated-by-annotation";
import { parsePrivateAnnotation } from "./annotations-parser/private-annotation";
import { parseQueryAnnotation } from "./annotations-parser/query-annotation";
import { parseLimitAnnotation } from "./annotations-parser/limit-annotation";
import { parseSelectableAnnotation } from "./annotations-parser/selectable-annotation";
import { parseSettableAnnotation } from "./annotations-parser/settable-annotation";
import { parseSubscriptionAnnotation } from "./annotations-parser/subscription-annotation";
import { parseTimestampAnnotation } from "./annotations-parser/timestamp-annotation";
import { parseUniqueAnnotation } from "./annotations-parser/unique-annotation";
import { parseFullTextAnnotation } from "./annotations-parser/full-text-annotation";
import { parseJWTClaimAnnotation } from "./annotations-parser/jwt-claim-annotation";
import { parseJWTPayloadAnnotation } from "./annotations-parser/jwt-payload-annotation";
import { parseAuthorizationAnnotation } from "./annotations-parser/authorization-annotation";
import { parseAuthenticationAnnotation } from "./annotations-parser/authentication-annotation";
import { parseSubscriptionsAuthorizationAnnotation } from "./annotations-parser/subscriptions-authorization-annotation";
import type { Annotation } from "../annotation/Annotation";
import { AnnotationsKey } from "../annotation/Annotation";
import { IDAnnotation } from "../annotation/IDAnnotation";
import { RelayIDAnnotation } from "../annotation/RelayIDAnnotation";

export function parseAnnotations(directives: readonly DirectiveNode[]): Annotation[] {
    const annotations = directives.reduce((directivesMap, directive) => {
        if (directivesMap.has(directive.name.value)) {
            // TODO: takes the first one
            // multiple interfaces can have this annotation - must constrain this flexibility by design
            return directivesMap;
        }
        const annotation = parseDirective(directive);
        if (annotation) {
            directivesMap.set(directive.name.value, annotation);
        }
        return directivesMap;
    }, new Map<string, Annotation>());
    return Array.from(annotations.values());
}

function parseDirective(directive: DirectiveNode): Annotation | undefined {
    switch (directive.name.value) {
        case AnnotationsKey.authentication:
            return parseAuthenticationAnnotation(directive);
        case AnnotationsKey.authorization:
            return parseAuthorizationAnnotation(directive);
        case AnnotationsKey.coalesce:
            return parseCoalesceAnnotation(directive);
        case AnnotationsKey.customResolver:
            return parseCustomResolverAnnotation(directive);
        case AnnotationsKey.cypher:
            return parseCypherAnnotation(directive);
        case AnnotationsKey.default:
            return parseDefaultAnnotation(directive);
        case AnnotationsKey.filterable:
            return parseFilterableAnnotation(directive);
        case AnnotationsKey.fulltext:
            return parseFullTextAnnotation(directive);
        case AnnotationsKey.id:
            return new IDAnnotation();
        case AnnotationsKey.jwtClaim:
            return parseJWTClaimAnnotation(directive);
        case AnnotationsKey.jwtPayload:
            return parseJWTPayloadAnnotation(directive);
        case AnnotationsKey.mutation:
            return parseMutationAnnotation(directive);
        case AnnotationsKey.plural:
            return parsePluralAnnotation(directive);
        case AnnotationsKey.populatedBy:
            return parsePopulatedByAnnotation(directive);
        case AnnotationsKey.private:
            return parsePrivateAnnotation(directive);
        case AnnotationsKey.query:
            return parseQueryAnnotation(directive);
        case AnnotationsKey.limit:
            return parseLimitAnnotation(directive);
        case AnnotationsKey.selectable:
            return parseSelectableAnnotation(directive);
        case AnnotationsKey.settable:
            return parseSettableAnnotation(directive);
        case AnnotationsKey.subscription:
            return parseSubscriptionAnnotation(directive);
        case AnnotationsKey.subscriptionsAuthorization:
            return parseSubscriptionsAuthorizationAnnotation(directive);
        case AnnotationsKey.timestamp:
            return parseTimestampAnnotation(directive);
        case AnnotationsKey.unique:
            return parseUniqueAnnotation(directive);
        case AnnotationsKey.relayId:
            return new RelayIDAnnotation();
        default:
            return undefined;
    }
}
