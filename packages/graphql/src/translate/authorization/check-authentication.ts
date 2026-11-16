/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../schema-model/annotation/AuthenticationAnnotation";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type { Operation } from "../../schema-model/Operation";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import { applyAuthentication } from "./utils/apply-authentication";

export function checkEntityAuthentication({
    context,
    entity,
    targetOperations,
    field,
}: {
    context: Neo4jGraphQLTranslationContext;
    entity: ConcreteEntity;
    targetOperations: AuthenticationOperation[];
    field?: string;
}) {
    const schemaLevelAnnotation = context.schemaModel.annotations.authentication;
    if (schemaLevelAnnotation) {
        applyAuthentication({ context, annotation: schemaLevelAnnotation, targetOperations });
    }

    const annotation: AuthenticationAnnotation | undefined = field
        ? entity.findAttribute(field)?.annotations.authentication
        : entity.annotations.authentication;

    if (annotation) {
        applyAuthentication({ context, annotation, targetOperations });
    }
}

export const isAuthenticated =
    (targetOperations: AuthenticationOperation[], operation: Operation | undefined) =>
    (next) =>
    (root, args, context, info) => {
        applyAuthenticationAnnotations({ context, operation, targetOperations, fieldName: info.fieldName });
        return next(root, args, context, info);
    };

export function applyAuthenticationAnnotations({
    context,
    operation,
    targetOperations,
    fieldName,
}: {
    context: Neo4jGraphQLTranslationContext;
    operation: Operation | undefined;
    targetOperations: AuthenticationOperation[];
    fieldName: string;
}): void {
    const field = operation?.findAttribute(fieldName) ?? operation?.findUserResolvedAttributes(fieldName);

    const annotations = [
        context.schemaModel.annotations.authentication,
        operation?.annotations.authentication,
        field?.annotations.authentication,
    ];

    for (const annotation of annotations) {
        if (annotation) {
            applyAuthentication({ context, annotation, targetOperations });
        }
    }
}
