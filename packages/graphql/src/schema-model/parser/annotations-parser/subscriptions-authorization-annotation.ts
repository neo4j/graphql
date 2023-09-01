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
import { Neo4jGraphQLSchemaValidationError } from "../../../classes";
import { parseArgumentsFromUnknownDirective } from "../parse-arguments";

import type { SubscriptionsAuthorizationFilterRuleConstructor } from "../../annotation/SubscriptionsAuthorizationAnnotation";
import {
    SubscriptionsAuthorizationAnnotation,
    SubscriptionsAuthorizationAnnotationArguments,
    SubscriptionsAuthorizationFilterRule,
} from "../../annotation/SubscriptionsAuthorizationAnnotation";

export function parseSubscriptionsAuthorizationAnnotation(
    directive: DirectiveNode
): SubscriptionsAuthorizationAnnotation {
    const { filter, ...unrecognizedArguments } = parseArgumentsFromUnknownDirective(directive) as {
        filter?: Record<string, any>[];
    };
    if (!filter) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@subscriptionsAuthorization requires at least one of ${SubscriptionsAuthorizationAnnotationArguments.join(
                ", "
            )} arguments`
        );
    }
    if (Object.keys(unrecognizedArguments).length) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@subscriptionsAuthorization unrecognized arguments: ${Object.keys(unrecognizedArguments).join(", ")}`
        );
    }

    const filterRules = filter?.map(
        (rule) => new SubscriptionsAuthorizationFilterRule(rule as SubscriptionsAuthorizationFilterRuleConstructor)
    );

    return new SubscriptionsAuthorizationAnnotation({
        filter: filterRules,
    });
}
