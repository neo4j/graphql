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

import type { Neo4jGraphQLSchemaModel } from "../../schema-model/Neo4jGraphQLSchemaModel";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import { filterTruthy } from "../../utils/utils";
import { V6DeleteOperation } from "../queryIR/DeleteOperation";
import { FilterFactory } from "./FilterFactory";
import type { GraphQLTreeDelete } from "./resolve-tree-parser/graphql-tree/graphql-tree";

export class DeleteOperationFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;
    private filterFactory: FilterFactory;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
        this.filterFactory = new FilterFactory(schemaModel);
    }

    public deleteAST({
        graphQLTreeDelete,
        entity,
    }: {
        graphQLTreeDelete: GraphQLTreeDelete;
        entity: ConcreteEntity;
    }): QueryAST {
        const operation = this.generateDeleteOperation({
            graphQLTreeDelete,
            entity,
        });
        return new QueryAST(operation);
    }

    private generateDeleteOperation({
        graphQLTreeDelete,
        entity,
    }: {
        graphQLTreeDelete: GraphQLTreeDelete;
        entity: ConcreteEntity;
    }): V6DeleteOperation {
        const targetAdapter = new ConcreteEntityAdapter(entity);

        const selection = new NodeSelection({
            target: targetAdapter,
        });

        const filters = filterTruthy([
            this.filterFactory.createFilters({ entity, where: graphQLTreeDelete.args.where }),
        ]);

        const deleteOP = new V6DeleteOperation({
            target: targetAdapter,
            selection,
            filters,
        });

        return deleteOP;
    }
}
