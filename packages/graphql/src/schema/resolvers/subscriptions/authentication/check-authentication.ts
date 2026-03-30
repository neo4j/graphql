/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQLError } from "../../../../classes";
import { AUTHORIZATION_UNAUTHENTICATED } from "../../../../constants";
import type {
    AuthenticationAnnotation,
    AuthenticationOperation,
} from "../../../../schema-model/annotation/AuthenticationAnnotation";
import type { Attribute } from "../../../../schema-model/attribute/Attribute";
import type { AttributeAdapter } from "../../../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../../../schema-model/entity/ConcreteEntity";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { filterByValues } from "../../../../translate/authorization/utils/filter-by-values";
import type { Neo4jGraphQLComposedSubscriptionsContext } from "../../composition/wrap-subscription";

export function checkAuthentication({
    authenticated,
    operation,
    context,
}: {
    authenticated: ConcreteEntity | Attribute | ConcreteEntityAdapter | AttributeAdapter;
    operation: AuthenticationOperation;
    context: Neo4jGraphQLComposedSubscriptionsContext;
}) {
    const schemaLevelAnnotation = context.schemaModel.annotations.authentication;
    if (schemaLevelAnnotation && schemaLevelAnnotation.operations.has(operation)) {
        applyAuthentication(schemaLevelAnnotation, context);
    }
    const annotation = authenticated.annotations.authentication;
    if (annotation && annotation.operations.has(operation)) {
        applyAuthentication(annotation, context);
    }
}

function applyAuthentication(annotation: AuthenticationAnnotation, context: Neo4jGraphQLComposedSubscriptionsContext) {
    if (!context.authorization.jwt) {
        throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
    }
    if (annotation.jwt) {
        const { jwt, claims } = context.authorization;
        const result = filterByValues(annotation.jwt, jwt, claims);
        if (!result) {
            throw new Neo4jGraphQLError(AUTHORIZATION_UNAUTHENTICATED);
        }
    }
}
