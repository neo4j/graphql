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
import type { AttributeAdapter } from "../../schema-model/attribute/model-adapters/AttributeAdapter";
import type { ConcreteEntity } from "../../schema-model/entity/ConcreteEntity";
import { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import type { V6ReadOperation } from "../queryIR/ConnectionReadOperation";
import { UpdateProperty } from "../queryIR/MutationInput/UpdateProperty";
import { V6UpdateOperation } from "../queryIR/UpdateOperation";
import { FilterFactory } from "./FilterFactory";
import { ReadOperationFactory } from "./ReadOperationFactory";
import type {
    GraphQLTreeUpdate,
    GraphQLTreeUpdateField,
    GraphQLTreeUpdateInput,
} from "./resolve-tree-parser/graphql-tree/graphql-tree";
import { getAttribute } from "./utils/get-attribute";

export class UpdateOperationFactory {
    public schemaModel: Neo4jGraphQLSchemaModel;
    private readFactory: ReadOperationFactory;
    private filterFactory: FilterFactory;

    constructor(schemaModel: Neo4jGraphQLSchemaModel) {
        this.schemaModel = schemaModel;
        this.readFactory = new ReadOperationFactory(schemaModel);
        this.filterFactory = new FilterFactory(schemaModel);
    }

    public createAST({
        graphQLTreeUpdate,
        entity,
    }: {
        graphQLTreeUpdate: GraphQLTreeUpdate;
        entity: ConcreteEntity;
    }): QueryAST {
        const operation = this.generateUpdateOperation({
            graphQLTreeUpdate,
            entity,
        });
        return new QueryAST(operation);
    }

    private generateUpdateOperation({
        graphQLTreeUpdate,
        entity,
    }: {
        graphQLTreeUpdate: GraphQLTreeUpdate;
        entity: ConcreteEntity;
    }): V6UpdateOperation {
        const topLevelUpdateInput = graphQLTreeUpdate.args.input;
        const targetAdapter = new ConcreteEntityAdapter(entity);
        let projection: V6ReadOperation | undefined;

        if (graphQLTreeUpdate.fields) {
            projection = this.readFactory.generateMutationProjection({
                graphQLTreeNode: graphQLTreeUpdate,
                entity,
            });
        }
        const inputFields = this.getInputFields({
            target: targetAdapter,
            updateInput: topLevelUpdateInput,
        });

        const filters = this.filterFactory.createFilters({
            entity,
            where: graphQLTreeUpdate.args.where,
        });

        return new V6UpdateOperation({
            target: targetAdapter,
            projection,
            inputFields,
            selection: new NodeSelection({
                target: targetAdapter,
            }),
            filters: filters ? [filters] : [],
        });
    }

    private getInputFields({
        target,
        updateInput,
    }: {
        target: ConcreteEntityAdapter;
        updateInput: GraphQLTreeUpdateInput;
    }): UpdateProperty[] {
        return Object.entries(updateInput).flatMap(([attributeName, setOperations]) => {
            const attribute = getAttribute(target, attributeName);
            return this.getPropertyInputOperations(attribute, setOperations);
        });
    }
    private getPropertyInputOperations(
        attribute: AttributeAdapter,
        operations: GraphQLTreeUpdateField
    ): UpdateProperty[] {
        return Object.entries(operations).map(([operation, value]) => {
            // TODO: other operations
            return new UpdateProperty({
                value,
                attribute: attribute,
                attachedTo: "node",
            });
        });
    }
}
