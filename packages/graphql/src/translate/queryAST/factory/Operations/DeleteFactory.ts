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

import { asArray } from "@graphql-tools/utils";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { filterTruthy, isRecord } from "../../../../utils/utils";
import { checkEntityAuthentication } from "../../../authorization/check-authentication";
import type { Filter } from "../../ast/filters/Filter";
import { DeleteOperation } from "../../ast/operations/DeleteOperation";
import { NodeSelection } from "../../ast/selection/NodeSelection";
import { RelationshipSelection } from "../../ast/selection/RelationshipSelection";
import { getConcreteEntities } from "../../utils/get-concrete-entities";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";
import type { QueryASTFactory } from "../QueryASTFactory";

export class DeleteFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
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

    public createTopLevelDeleteOperation({
        entity,
        resolveTree,
        context,
        varName,
    }: {
        entity: ConcreteEntityAdapter;
        resolveTree: Record<string, any>;
        context: Neo4jGraphQLTranslationContext;
        varName?: string;
    }): DeleteOperation {
        checkEntityAuthentication({
            entity: entity.entity,
            targetOperations: ["DELETE"],
            context,
        });
        const { whereArg, deleteArg } = this.parseDeleteArgs(resolveTree.args, false);
        const selection = new NodeSelection({
            target: entity,
            alias: varName,
        });
        const nodeFilters = this.queryASTFactory.filterFactory.createNodeFilters(entity, whereArg.node);
        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity,
            operations: ["DELETE"],
            context,
        });
        const nestedDeleteOperations = this.createNestedDeleteOperations(deleteArg, entity, context);
        return new DeleteOperation({
            target: entity,
            selection,
            filters: nodeFilters,
            authFilters,
            nestedOperations: nestedDeleteOperations,
        });
    }

    private createNestedDeleteOperationsForInterface({
        deleteArg,
        relationship,
        target,
        context,
    }: {
        deleteArg: Record<string, any>;
        relationship: RelationshipAdapter;
        target: InterfaceEntityAdapter;
        context: Neo4jGraphQLTranslationContext;
    }): DeleteOperation[] {
        return target.concreteEntities.flatMap((concreteEntity) => {
            return this.createNestedDeleteOperation({
                relationship,
                target: concreteEntity,
                args: deleteArg,
                context,
                partialOf: target,
            });
        });
    }

    private createNestedDeleteOperationsForUnion({
        deleteArg,
        relationship,
        target,
        context,
    }: {
        deleteArg: Record<string, any>;
        relationship: RelationshipAdapter;
        target: UnionEntityAdapter;
        context: Neo4jGraphQLTranslationContext;
    }): DeleteOperation[] {
        const concreteEntities = getConcreteEntities(target, deleteArg);

        return concreteEntities.flatMap((concreteEntity) => {
            return asArray(deleteArg[concreteEntity.name]).flatMap((concreteArgs) => {
                return this.createNestedDeleteOperation({
                    relationship,
                    target: concreteEntity,
                    args: concreteArgs,
                    context,
                });
            });
        });
    }

    private createNestedDeleteOperations(
        deleteArg: Record<string, any>,
        source: ConcreteEntityAdapter,
        context: Neo4jGraphQLTranslationContext
    ): DeleteOperation[] {
        return filterTruthy(
            Object.entries(deleteArg).flatMap(([key, valueArr]) => {
                return asArray(valueArr).flatMap((value) => {
                    const relationship = source.findRelationship(key);
                    if (!relationship) {
                        throw new Error(`Failed to find relationship ${key}`);
                    }
                    const target = relationship.target;
                    if (isInterfaceEntity(target)) {
                        return this.createNestedDeleteOperationsForInterface({
                            deleteArg: value,
                            relationship,
                            target,
                            context,
                        });
                    }
                    if (isUnionEntity(target)) {
                        return this.createNestedDeleteOperationsForUnion({
                            deleteArg: value,
                            relationship,
                            target,
                            context,
                        });
                    }

                    return this.createNestedDeleteOperation({
                        relationship,
                        target,
                        args: value,
                        context,
                    });
                });
            })
        );
    }

    private createNestedDeleteOperation({
        relationship,
        target,
        args,
        context,
        partialOf,
    }: {
        relationship: RelationshipAdapter;
        target: ConcreteEntityAdapter;
        args: Record<string, any>;
        context: Neo4jGraphQLTranslationContext;
        partialOf?: InterfaceEntityAdapter;
    }): DeleteOperation[] {
        const { whereArg, deleteArg } = this.parseDeleteArgs(args, true);

        checkEntityAuthentication({
            entity: target.entity,
            targetOperations: ["DELETE"],
            context,
        });

        const selection = new RelationshipSelection({
            relationship,
            directed: true,
            optional: true,
            targetOverride: target,
        });
        let nodeFilters: Filter[];
        if (partialOf && isInterfaceEntity(partialOf)) {
            nodeFilters = this.queryASTFactory.filterFactory.createInterfaceNodeFilters({
                entity: partialOf,
                targetEntity: target,
                whereFields: whereArg.node,
            });
        } else {
            nodeFilters = this.queryASTFactory.filterFactory.createNodeFilters(target, whereArg.node);
        }
        const edgeFilters = this.queryASTFactory.filterFactory.createEdgeFilters(relationship, whereArg.edge);

        const filters = [...nodeFilters, ...edgeFilters];

        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity: target,
            operations: ["DELETE"],
            context,
        });

        const nestedDeleteOperations = this.createNestedDeleteOperations(deleteArg, target, context);
        return [
            new DeleteOperation({
                target,
                selection,
                filters,
                authFilters,
                nestedOperations: nestedDeleteOperations,
            }),
        ];
    }
}
