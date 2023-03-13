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
    AuthorizationFilterRuleConstructor,
    AuthorizationValidateRule,
    AuthorizationValidateRuleConstructor,
} from "../annotation/AuthorizationAnnotation";
import { parseArguments } from "./utils";

export function parseAuthorizationAnnotation(directive: DirectiveNode): AuthorizationAnnotation {
    const { filter, validate, ...unrecognizedArguments } = parseArguments(directive) as {
        filter?: Record<string, any>[];
        validate?: Record<string, any>[];
    };
    if (!filter && !validate) {
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
        (rule) => new AuthorizationFilterRule(rule as AuthorizationFilterRuleConstructor)
    );
    const validateRules = validate?.map(
        (rule) => new AuthorizationValidateRule(rule as AuthorizationValidateRuleConstructor)
    );
    return new AuthorizationAnnotation({
        filter: filterRules,
        validate: validateRules,
    });
}
