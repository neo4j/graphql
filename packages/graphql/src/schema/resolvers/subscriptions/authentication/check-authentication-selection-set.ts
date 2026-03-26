/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { GraphQLResolveInfo } from "graphql";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { parseResolveInfo } from "graphql-parse-resolve-info";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../composition/wrap-subscription";
import type { SubscriptionEventType } from "../types";
import { checkAuthentication } from "./check-authentication";
import type { SelectionFields } from "./selection-set-parser";
import { parseSelectionSetForAuthenticated } from "./selection-set-parser";

export function checkAuthenticationOnSelectionSet(
    resolveInfo: GraphQLResolveInfo,
    entityAdapter: ConcreteEntityAdapter,
    type: SubscriptionEventType,
    context: Neo4jGraphQLComposedSubscriptionsContext
) {
    const resolveTree = parseResolveInfo(resolveInfo) as ResolveTree | undefined | null;
    if (!resolveTree) {
        return;
    }

    const authenticatedSelections = parseSelectionSetForAuthenticated({
        resolveTree,
        entity: entityAdapter,
        entityTypeName: entityAdapter.operations.subscriptionEventTypeNames[type],
        entityPayloadTypeName: entityAdapter.operations.subscriptionEventPayloadFieldNames[type],
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
    entity: ConcreteEntity | ConcreteEntityAdapter;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}) {
    checkAuthentication({ authenticated: entity, operation: "READ", context });
    for (const selectedField of Object.values(fieldSelection)) {
        const field = entity.attributes.get(selectedField.name);
        if (field) {
            checkAuthentication({ authenticated: field, operation: "READ", context });
        }
    }
}
