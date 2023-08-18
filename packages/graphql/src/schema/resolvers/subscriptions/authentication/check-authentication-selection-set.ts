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

import type Node from "../../../../classes/Node";
import type { SubscriptionEventType } from "../types";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { GraphQLResolveInfo } from "graphql";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { parseResolveInfo } from "graphql-parse-resolve-info";
import type { SelectionFields } from "./selection-set-parser";
import { parseSelectionSetForAuthenticated } from "./selection-set-parser";
import { checkAuthentication } from "./check-authentication";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../composition/wrap-subscription";

export function checkAuthenticationOnSelectionSet(
    resolveInfo: GraphQLResolveInfo,
    node: Node,
    type: SubscriptionEventType,
    context: Neo4jGraphQLComposedSubscriptionsContext
) {
    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree | undefined | null;
    if (!resolveTree) {
        return;
    }
    const entities = context.schemaModel.getEntitiesByNameAndLabels(node.name, node.getAllLabels());
    if (!entities.length) {
        return;
    }
    const concreteEntity = entities[0] as ConcreteEntity;
    const authenticatedSelections = parseSelectionSetForAuthenticated({
        resolveTree,
        entity: concreteEntity,
        entityTypeName: node.subscriptionEventTypeNames[type],
        entityPayloadTypeName: node.subscriptionEventPayloadFieldNames[type],
        context,
    });
    authenticatedSelections.forEach(({ entity, fieldSelection }) =>
        checkAuthenticationOnSelection({ entity, fieldSelection, context })
    );
}

function checkAuthenticationOnSelection({
    fieldSelection,
    entity,
    context,
}: {
    fieldSelection: SelectionFields;
    entity: ConcreteEntity;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}) {
    checkAuthentication({ authenticated: entity, operation: "READ", context });
    for (const selectedField of Object.values(fieldSelection)) {
        const field = entity.findAttribute(selectedField.name);
        if (field) {
            checkAuthentication({ authenticated: field, operation: "READ", context });
        }
    }
}
