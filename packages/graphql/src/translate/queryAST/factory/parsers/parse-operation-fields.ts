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
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";

export type OperationFieldMatch = {
    isRead: boolean;
    isConnection: boolean;
    isAggregation: boolean;
    isCreate: boolean;
    isUpdate: boolean;
    isCustomCypher: boolean;
    isDelete: boolean;
};

export function parseTopLevelOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter?: EntityAdapter
): OperationFieldMatch {
    if (!entityAdapter) {
        return {
            isRead: false,
            isConnection: false,
            isAggregation: false,
            isCreate: false,
            isUpdate: false,
            isCustomCypher: true,
            isDelete: false,
        };
    }
    if (isInterfaceEntity(entityAdapter)) {
        return parseInterfaceOperationField(field, schemaModel, entityAdapter);
    }
    if (isUnionEntity(entityAdapter)) {
        return parseUnionOperationField(field, schemaModel, entityAdapter);
    }

    return parseOperationField(field, schemaModel, entityAdapter);
}

function parseOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter: ConcreteEntityAdapter
): OperationFieldMatch {
    const rootTypeFieldNames = entityAdapter.operations.rootTypeFieldNames;
    return {
        isRead: field === rootTypeFieldNames.read,
        isConnection: field === rootTypeFieldNames.connection,
        isAggregation: field === rootTypeFieldNames.aggregate,
        isCreate: field === rootTypeFieldNames.create,
        isUpdate: field === rootTypeFieldNames.update,
        isCustomCypher: !!(
            schemaModel.operations.Query?.findAttribute(field) || schemaModel.operations.Mutation?.findAttribute(field)
        ),
        isDelete: field === rootTypeFieldNames.delete,
    };
}

function parseInterfaceOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter: InterfaceEntityAdapter
): OperationFieldMatch {
    const rootTypeFieldNames = entityAdapter.operations.rootTypeFieldNames;
    return {
        isRead: field === rootTypeFieldNames.read,
        isConnection: false, //connection not supported as interface top-level operation
        isAggregation: field === rootTypeFieldNames.aggregate,
        isCreate: field === rootTypeFieldNames.create,
        isUpdate: field === rootTypeFieldNames.update,
        isCustomCypher: !!(
            schemaModel.operations.Query?.findAttribute(field) || schemaModel.operations.Mutation?.findAttribute(field)
        ),
        isDelete: false, //delete not supported as interface top-level operation
    };
}

function parseUnionOperationField(
    field: string,
    schemaModel: Neo4jGraphQLSchemaModel,
    entityAdapter: UnionEntityAdapter
): OperationFieldMatch {
    const rootTypeFieldNames = entityAdapter.operations.rootTypeFieldNames;
    return {
        isRead: field === rootTypeFieldNames.read,
        isConnection: false,
        isAggregation: false,
        isCreate: false,
        isUpdate: false,
        isCustomCypher: !!(
            schemaModel.operations.Query?.findAttribute(field) || schemaModel.operations.Mutation?.findAttribute(field)
        ),
        isDelete: false, //delete not supported as interface top-level operation
    };
}
