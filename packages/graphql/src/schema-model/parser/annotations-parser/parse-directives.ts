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
import { parseAliasAnnotation } from "./alias-annotation";
import { parseCoalesceAnnotation } from "./coalesce-annotation";
import { parseCypherAnnotation } from "./cypher-annotation";
import { parseCustomResolverAnnotation } from "./custom-resolver-annotation";
import { parseDefaultAnnotation } from "./default-annotation";
import { parseIDAnnotation } from "./id-annotation";
import { parseFilterableAnnotation } from "./filterable-annotation";
import { parseMutationAnnotation } from "./mutation-annotation";
import { parsePluralAnnotation } from "./plural-annotation";
import { parsePopulatedByAnnotation } from "./populated-by-annotation";
import { parsePrivateAnnotation } from "./private-annotation";
import { parseQueryAnnotation } from "./query-annotation";
import { parseQueryOptionsAnnotation } from "./query-options-annotation";
import { parseSelectableAnnotation } from "./selectable-annotation";
import { parseSettableAnnotation } from "./settable-annotation";
import { parseSubscriptionAnnotation } from "./subscription-annotation";
import { parseTimestampAnnotation } from "./timestamp-annotation";
import { parseUniqueAnnotation } from "./unique-annotation";
import { parseFullTextAnnotation } from "./full-text-annotation";
import { parseJWTClaimAnnotation } from "./jwt-claim-annotation";
import { parseJWTPayloadAnnotation } from "./jwt-payload-annotation";
import { parseAuthorizationAnnotation } from "./authorization-annotation";
import { parseAuthenticationAnnotation } from "./authentication-annotation";
import { parseSubscriptionsAuthorizationAnnotation } from "./subscriptions-authorization-annotation";
import { filterTruthy } from "../../../utils/utils";
import type { Annotation } from "../../annotation/Annotation";
import { AnnotationsKey } from "../../annotation/Annotation";

export function parseDirectives(directives: readonly DirectiveNode[]): Annotation[] {
    return filterTruthy(
        directives.map((directive) => {
            switch (directive.name.value) {
                case AnnotationsKey.alias:
                    return parseAliasAnnotation(directive);
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
                    return parseIDAnnotation(directive);
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
                case AnnotationsKey.queryOptions:
                    return parseQueryOptionsAnnotation(directive);
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
                default:
                    return undefined;
            }
        })
    );
}
