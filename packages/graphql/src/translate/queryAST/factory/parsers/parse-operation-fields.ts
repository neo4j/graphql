/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { Neo4jGraphQLSchemaModel } from "../../../../schema-model/Neo4jGraphQLSchemaModel";
import type { EntityAdapter } from "../../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";

type TopLevelOperationFieldMatch =
    | "READ"
    | "CONNECTION"
    | "AGGREGATE"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CUSTOM_CYPHER"
    | "FULLTEXT"
    | "VECTOR";

export function parseTopLevelOperationField(
    field: string,
    context: Neo4jGraphQLTranslationContext,
    entityAdapter?: EntityAdapter
): TopLevelOperationFieldMatch {
    if (!entityAdapter) {
        return "CUSTOM_CYPHER";
    }
    if (context.fulltext) {
        return "FULLTEXT";
    }
    if (context.vector) {
        return "VECTOR";
    }
    if (isInterfaceEntity(entityAdapter)) {
        return parseInterfaceOperationField(field, context.schemaModel, entityAdapter);
    }
    if (isUnionEntity(entityAdapter)) {
        return parseUnionOperationField(field, context.schemaModel, entityAdapter);
    }

    return parseOperationField(field, context.schemaModel, entityAdapter);
}

function parseOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter: ConcreteEntityAdapter
): TopLevelOperationFieldMatch {
    const rootTypeFieldNames = entityAdapter.operations.rootTypeFieldNames;
    if (schemaModel.operations.Query?.findAttribute(field) || schemaModel.operations.Mutation?.findAttribute(field)) {
        return "CUSTOM_CYPHER";
    }
    switch (field) {
        case "_entities":
        case rootTypeFieldNames.read:
            return "READ";
        case rootTypeFieldNames.connection:
            return "CONNECTION";
        case rootTypeFieldNames.aggregate:
            return "AGGREGATE";
        case rootTypeFieldNames.create:
            return "CREATE";
        case rootTypeFieldNames.update:
            return "UPDATE";
        case rootTypeFieldNames.delete:
            return "DELETE";
        default:
            throw new Error(`Type does not support this operation: ${field}`);
    }
}

function parseInterfaceOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter: InterfaceEntityAdapter
): TopLevelOperationFieldMatch {
    const rootTypeFieldNames = entityAdapter.operations.rootTypeFieldNames;
    if (schemaModel.operations.Query?.findAttribute(field) || schemaModel.operations.Mutation?.findAttribute(field)) {
        return "CUSTOM_CYPHER";
    }
    switch (field) {
        case rootTypeFieldNames.read:
            return "READ";
        case rootTypeFieldNames.connection:
            return "CONNECTION";
        case rootTypeFieldNames.aggregate:
            return "AGGREGATE";
        default:
            throw new Error(`Interface does not support this operation: ${field}`);
    }
}

function parseUnionOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter: UnionEntityAdapter
): TopLevelOperationFieldMatch {
    const rootTypeFieldNames = entityAdapter.operations.rootTypeFieldNames;
    if (schemaModel.operations.Query?.findAttribute(field) || schemaModel.operations.Mutation?.findAttribute(field)) {
        return "CUSTOM_CYPHER";
    }
    switch (field) {
        case rootTypeFieldNames.read:
            return "READ";
        default:
            throw new Error(`Union does not support this operation: ${field}`);
    }
}
