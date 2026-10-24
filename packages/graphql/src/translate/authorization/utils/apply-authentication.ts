/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQLError } from "../../../classes";
import { AUTHORIZATION_UNAUTHENTICATED } from "../../../constants";
import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../../schema-model/annotation/AuthenticationAnnotation";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { filterByValues } from "./filter-by-values";

export function applyAuthentication({
    context,
    annotation,
    targetOperations,
}: {
    context: Neo4jGraphQLTranslationContext;
    annotation: AuthenticationAnnotation;
    targetOperations: AuthenticationOperation[];
}): void {
    if (context.dryRun) {
        return;
    }
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
