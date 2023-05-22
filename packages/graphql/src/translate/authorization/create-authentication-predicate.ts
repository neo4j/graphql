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

import Cypher from "@neo4j/cypher-builder";
import type { Context } from "../../types";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../schema-model/annotation/AuthenticationAnnotation";
import { AUTH_UNAUTHENTICATED_ERROR } from "../../constants";

export function createNodeAuthenticationPredicate({
    entity,
    context,
    operations,
    fieldName,
    conditionForEvaluation,
}: {
    context: Context;
    entity: ConcreteEntity;
    operations: AuthenticationOperation[];
    fieldName?: string;
    conditionForEvaluation?: Cypher.Predicate;
}): Cypher.Predicate | undefined {
    let annotation: AuthenticationAnnotation | undefined;
    if (fieldName) {
        annotation = entity.attributes.get(fieldName)?.annotations.authentication;
    } else {
        annotation = entity.annotations.authentication;
    }
    if (!annotation) {
        return;
    }

    const requiresAuthentication = annotation.operations.some((operation) => operations.includes(operation));
    if (!requiresAuthentication) {
        return;
    }
    let innerPredicate: Cypher.Predicate = Cypher.eq(
        context.authorization.isAuthenticatedParam,
        new Cypher.Literal(false)
    );
    if (conditionForEvaluation) {
        innerPredicate = Cypher.and(conditionForEvaluation, innerPredicate);
    }

    return Cypher.apoc.util.validatePredicate(innerPredicate, AUTH_UNAUTHENTICATED_ERROR);
}
