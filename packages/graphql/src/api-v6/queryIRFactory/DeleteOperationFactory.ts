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
import type { RelationshipAdapter } from "../../schema-model/relationship/model-adapters/RelationshipAdapter";
import { QueryAST } from "../../translate/queryAST/ast/QueryAST";
import { NodeSelection } from "../../translate/queryAST/ast/selection/NodeSelection";
import { RelationshipSelection } from "../../translate/queryAST/ast/selection/RelationshipSelection";
import { isInterfaceEntity } from "../../translate/queryAST/utils/is-interface-entity";
import { isUnionEntity } from "../../translate/queryAST/utils/is-union-entity";
import { asArray, filterTruthy, isRecord } from "../../utils/utils";
import { V6DeleteOperation } from "../queryIR/DeleteOperation";
import { FilterFactory } from "./FilterFactory";
import type { GraphQLTreeDelete, GraphQLTreeDeleteInput } from "./resolve-tree-parser/graphql-tree/graphql-tree";

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
            this.filterFactory.createFilters({
                entity,
                where: graphQLTreeDelete.args.where,
            }),
        ]);

        const nestedDeleteOperations: V6DeleteOperation[] = [];
        if (graphQLTreeDelete.args.input) {
            nestedDeleteOperations.push(
                ...this.createNestedDeleteOperations(graphQLTreeDelete.args.input, targetAdapter)
            );
        }

        const deleteOP = new V6DeleteOperation({
            target: targetAdapter,
            selection,
            filters,
            nestedOperations: nestedDeleteOperations,
        });

        return deleteOP;
    }

    private createNestedDeleteOperations(
        deleteArg: GraphQLTreeDeleteInput,
        source: ConcreteEntityAdapter
    ): V6DeleteOperation[] {
        return filterTruthy(
            Object.entries(deleteArg).flatMap(([key, valueArr]) => {
                return asArray(valueArr).flatMap((value) => {
                    const relationship = source.findRelationship(key);
                    if (!relationship) {
                        throw new Error(`Failed to find relationship ${key}`);
                    }
                    const target = relationship.target;

                    if (isInterfaceEntity(target)) {
                        // TODO: Implement createNestedDeleteOperationsForInterface
                        // return this.createNestedDeleteOperationsForInterface({
                        //     deleteArg: value,
                        //     relationship,
                        //     target,
                        // });
                        return;
                    }
                    if (isUnionEntity(target)) {
                        // TODO: Implement createNestedDeleteOperationsForUnion
                        // return this.createNestedDeleteOperationsForUnion({
                        //     deleteArg: value,
                        //     relationship,
                        //     target,
                        // });
                        return;
                    }

                    return this.createNestedDeleteOperation({
                        relationship,
                        target,
                        args: value as Record<string, any>,
                    });
                });
            })
        );
    }

    private parseDeleteArgs(
        args: Record<string, any>,
        isTopLevel: boolean
    ): {
        whereArg: { node: Record<string, any>; edge: Record<string, any> };
        deleteArg: Record<string, any>;
    } {
        let whereArg;
        const rawWhere = isRecord(args.where) ? args.where : {};
        if (isTopLevel) {
            whereArg = { node: rawWhere.node ?? {}, edge: rawWhere.edge ?? {} };
        } else {
            whereArg = { node: rawWhere, edge: {} };
        }
        const deleteArg = isRecord(args.delete) ? args.delete : {};
        return { whereArg, deleteArg };
    }

    private createNestedDeleteOperation({
        relationship,
        target,
        args,
    }: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        args: Record<string, any>;
    }): V6DeleteOperation[] {
        const { whereArg, deleteArg } = this.parseDeleteArgs(args, true);

        const selection = new RelationshipSelection({
            relationship,
            directed: true,
            optional: true,
            targetOverride: target,
        });

        const filters = filterTruthy([
            this.filterFactory.createFilters({
                entity: target.entity,
                where: whereArg,
            }),
        ]);

        const nestedDeleteOperations = this.createNestedDeleteOperations(deleteArg, target);
        return [
            new V6DeleteOperation({
                target,
                selection,
                filters,
                nestedOperations: nestedDeleteOperations,
            }),
        ];
    }
}
