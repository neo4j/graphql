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

import type { Node } from "../../classes";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../schema-model/annotation/AuthenticationAnnotation";
import { applyAuthentication } from "./utils/apply-authentication";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import type { Operation } from "../../schema-model/Operation";

export function checkAuthentication({
    context,
    node,
    targetOperations,
    field,
}: {
    context: Neo4jGraphQLTranslationContext;
    node: Node;
    targetOperations: AuthenticationOperation[];
    field?: string;
}) {
    const concreteEntities = context.schemaModel.getEntitiesByNameAndLabels(node.name, node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }
    const entity = concreteEntities[0] as ConcreteEntity;

    return checkEntityAuthentication({
        context,
        entity,
        targetOperations,
        field,
    });
}

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
            const { fieldName } = info;
            const annotation: AuthenticationAnnotation | undefined =
                entity.annotations.authentication ||
                (fieldName && entity.findUserResolvedAttributes(fieldName)?.annotations.authentication);

            if (annotation) {
                applyAuthentication({ context, annotation, targetOperations });
            }
        }

        return next(root, args, context, info);
    };
