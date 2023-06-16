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
import type { Context } from "../../types";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../schema-model/annotation/AuthenticationAnnotation";
import { applyAuthentication } from "./utils/apply-authentication";

export function checkAuthentication({
    context,
    node,
    targetOperations,
    field,
}: {
    context: Context;
    node: Node;
    targetOperations: AuthenticationOperation[]; // one of these have to be present in the authentication.operations options
    field?: string;
}) {
    const concreteEntities = context.schemaModel.getEntitiesByNameAndLabels(node.name, node.getAllLabels());

    if (concreteEntities.length !== 1) {
        throw new Error("Couldn't match entity");
    }

    const entity = concreteEntities[0] as ConcreteEntity;

    const annotation: AuthenticationAnnotation | undefined = field
        ? entity.findAttribute(field)?.annotations.authentication
        : entity.annotations.authentication;

    if (annotation) {
        const requiresAuthentication = targetOperations.some(
            (targetOperation) => annotation && annotation.operations.has(targetOperation)
        );
        if (requiresAuthentication) {
            applyAuthentication({ context, annotation });
        }
    }
}
