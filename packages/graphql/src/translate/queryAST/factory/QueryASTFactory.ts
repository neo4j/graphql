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

import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import type { ResolveTree } from "graphql-parse-resolve-info";
import { QueryAST } from "../ast/QueryAST";
import { OperationsFactory } from "./OperationFactory";
import type { Neo4jGraphQLTranslationContext } from "../../../types/neo4j-graphql-translation-context";
import { ReadOperation } from "../ast/operations/ReadOperation";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";

const TOP_LEVEL_NODE_NAME = "this";

export class QueryASTFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;
    public operationsFactory: OperationsFactory;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
        this.operationsFactory = new OperationsFactory(this);
    }

    public createQueryAST(
        resolveTree: ResolveTree,
        entityAdapter: ConcreteEntityAdapter | InterfaceEntityAdapter,
        context: Neo4jGraphQLTranslationContext
    ): QueryAST {
        const operation = this.operationsFactory.createReadOperation(entityAdapter, resolveTree, context);
        if (operation instanceof ReadOperation) {
            operation.nodeAlias = TOP_LEVEL_NODE_NAME;
        }
        return new QueryAST(operation);
    }
}
