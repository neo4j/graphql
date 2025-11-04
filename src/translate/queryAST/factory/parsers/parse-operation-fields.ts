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

import type { Neo4jGraphQLSchemaModel } from "../../../../schema-model/Neo4jGraphQLSchemaModel";
import type { EntityAdapter } from "../../../../schema-model/entity/EntityAdapter";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";

export type TopLevelOperationFieldMatch =
    | "READ"
    | "CONNECTION"
    | "AGGREGATE"
    | "CREATE"
    | "UPDATE"
    | "DELETE"
    | "CUSTOM_CYPHER"
    | "VECTOR";

export function parseTopLevelOperationField(
    field: string,
    context: Neo4jGraphQLTranslationContext,
    entityAdapter?: EntityAdapter
): TopLevelOperationFieldMatch {
    if (!entityAdapter) {
        return "CUSTOM_CYPHER";
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
