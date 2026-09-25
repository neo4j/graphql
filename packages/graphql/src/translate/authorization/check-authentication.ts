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
    (targetOperations: AuthenticationOperation[], entity: Operation | undefined) =>
    (next) =>
    (root, args, context, info) => {
        const schemaLevelAnnotation = context.schemaModel.annotations.authentication;
        if (schemaLevelAnnotation) {
            applyAuthentication({ context, annotation: schemaLevelAnnotation, targetOperations });
        }

        if (entity) {
            const typeAnnotation: AuthenticationAnnotation | undefined = entity.annotations.authentication;
            if (typeAnnotation) {
                applyAuthentication({ context, annotation: typeAnnotation, targetOperations });
            }

            const { fieldName } = info;
            const fieldAnnotation: AuthenticationAnnotation | undefined = fieldName
                ? entity.findUserResolvedAttributes(fieldName)?.annotations.authentication
                : undefined;
            if (fieldAnnotation) {
                applyAuthentication({ context, annotation: fieldAnnotation, targetOperations });
            }
        }

        return next(root, args, context, info);
    };
