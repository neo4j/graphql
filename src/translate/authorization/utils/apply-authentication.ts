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

import { Neo4jGraphQLError } from "../../../classes";
import { AUTHORIZATION_UNAUTHENTICATED } from "../../../constants";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterByValues } from "./filter-by-values";
import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../../schema-model/annotation/AuthenticationAnnotation";

export function applyAuthentication({
    context,
    annotation,
    targetOperations,
}: {
    context: Neo4jGraphQLTranslationContext;
    annotation: AuthenticationAnnotation;
    targetOperations: AuthenticationOperation[];
}): void {
    const requiresAuthentication = targetOperations.some((targetOperation) =>
        annotation.operations.has(targetOperation)
    );
    if (!requiresAuthentication) {
        return;
    }
    if (!context.authorization.isAuthenticated) {
        throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
    }
    if (annotation.jwt) {
        const { jwt, claims } = context.authorization;
        if (!jwt || !filterByValues(annotation.jwt, jwt, claims)) {
            throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
        }
    }
}
