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
import { Neo4jGraphQLError } from "../../classes";
import type { Context } from "../../types";
import { AUTHORIZATION_UNAUTHENTICATED } from "../../constants";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { filterByValues } from "../../schema/resolvers/subscriptions/where/filters/filter-by-values";
import type { AuthenticationAnnotation } from "../../schema-model/annotation/AuthenticationAnnotation";
import type { Annotation } from "../../schema-model/annotation/Annotation";

export function checkAuthentication({
    context,
    node,
    targetOperations,
    field,
}: {
    context: Context;
    node: Node;
    targetOperations: string[]; // one of these have to be present in the authentication.operations options
    field?: string;
}) {
    const concreteEntities = context.schemaModel.getEntitiesByNameAndLabels(node.name, node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }

    const entity = concreteEntities[0] as ConcreteEntity;

    let annotation: AuthenticationAnnotation | undefined = undefined;
    if (field) {
        annotation = entity.findAttribute(field)?.annotations.authentication;
    } else {
        annotation = entity.annotations.authentication;
    }

    if (annotation) {
        const requiresAuthentication = targetOperations.some(
            (targetOperation) => annotation && annotation.operations.some((operation) => operation === targetOperation)
        );
        if (requiresAuthentication) {
            applyAuthentication({ context, annotation });
        }
    }
}

export function applyAuthentication({ context, annotation }: { context: Context; annotation: Annotation }) {
    if (!context.authorization.isAuthenticated) {
        throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
    }
    if ("jwtPayload" in annotation && annotation.jwtPayload) {
        const jwt = context.authorization.jwt;
        if (!jwt || !filterByValues(annotation.jwtPayload, jwt)) {
            throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
        }
    }
}
