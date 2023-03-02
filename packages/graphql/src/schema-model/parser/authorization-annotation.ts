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
import { Neo4jGraphQLSchemaValidationError } from "../../classes";
import {
    AuthorizationAnnotation,
    AuthorizationAnnotationArguments,
    AuthorizationFilterRule,
    AuthorizationFilterRules,
} from "../annotation/AuthorizationAnnotation";
import { parseArguments } from "./utils";

export function parseAuthorizationAnnotation(directive: DirectiveNode): AuthorizationAnnotation {
    const { filter, filterSubscriptions, validate, ...unrecognizedArguments } = parseArguments(directive) as {
        filter?: Record<string, any>[];
        filterSubscriptions?: Record<string, any>[];
        validate?: { pre: Record<string, any>[]; post: Record<string, any>[] };
    };
    if (!filter && !filterSubscriptions && !validate) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@authorization requires at least one of ${Object.values(AuthorizationAnnotationArguments).join(
                ", "
            )} arguments`
        );
    }
    if (Object.keys(unrecognizedArguments).length) {
        throw new Neo4jGraphQLSchemaValidationError(
            `@authorization unrecognized arguments: ${Object.keys(unrecognizedArguments).join(", ")}`
        );
    }
    const filterRules = filter?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.filter })
    );
    const filterSubscriptionRules = filterSubscriptions?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.filterSubscription })
    );
    const validatePreRules = validate?.pre?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.validationPre })
    );
    const validatePostRules = validate?.post?.map(
        (rule) => new AuthorizationFilterRule({ ...rule, ruleType: AuthorizationFilterRules.validationPost })
    );
    return new AuthorizationAnnotation({
        filter: filterRules,
        filterSubscriptions: filterSubscriptionRules,
        validatePre: validatePreRules,
        validatePost: validatePostRules,
    });
}
