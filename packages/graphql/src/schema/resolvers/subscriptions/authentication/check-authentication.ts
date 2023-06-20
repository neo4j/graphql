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

import type { SubscriptionContext } from "../types";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import { filterByValues } from "../../../../translate/authorization/utils/filter-by-values";
import type { AuthenticationOperation } from "../../../../schema-model/annotation/AuthenticationAnnotation";
import type { Attribute } from "../../../../schema-model/attribute/Attribute";

export function checkAuthentication({
    authenticated,
    operation,
    context,
}: {
    authenticated: ConcreteEntity | Attribute;
    operation: AuthenticationOperation;
    context: SubscriptionContext;
}) {
    const annotation = authenticated.annotations.authentication;
    if (annotation && annotation.operations.has(operation)) {
        if (!context.jwt) {
            throw new Error("Error, request not authorized");
        }
        if (annotation.jwt) {
            const result = filterByValues(annotation.jwt, context.jwt);
            if (!result) {
                throw new Error("Error, request not authorized");
            }
        }
    }
}
