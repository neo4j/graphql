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

import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { asArray } from "../../../../utils/utils";
import type { Filter } from "../../ast/filters/Filter";
import { MutationOperationField } from "../../ast/input-fields/MutationOperationField";
import { ParamInputField } from "../../ast/input-fields/ParamInputField";
import { DisconnectOperation } from "../../ast/operations/DisconnectOperation";
import { CompositeDisconnectOperation } from "../../ast/operations/composite/CompositeDisconnectOperation";
import { CompositeDisconnectPartial } from "../../ast/operations/composite/CompositeDisconnectPartial";
import { RelationshipSelectionPattern } from "../../ast/selection/SelectionPattern/RelationshipSelectionPattern";
import type { CallbackBucket } from "../../utils/callback-bucket";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";
import { raiseAttributeAmbiguity } from "../../utils/raise-attribute-ambiguity";
import type { QueryASTFactory } from "../QueryASTFactory";

export class DisconnectFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createDisconnectOperation(
        entity: ConcreteEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext,
        callbackBucket: CallbackBucket
    ): DisconnectOperation {
        const disconnectOP = new DisconnectOperation({
            target: entity,
            selectionPattern: new RelationshipSelectionPattern({
                relationship,
                targetOverride: entity,
            }),
            relationship,
        });

        this.hydrateDisconnectOperation({
            target: entity,
            relationship,
            input,
            disconnect: disconnectOP,
            context,
            callbackBucket,
        });
        return disconnectOP;
    }

    public createCompositeDisconnectOperation(
        entity: InterfaceEntityAdapter | UnionEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext,
        callbackBucket: CallbackBucket
    ): CompositeDisconnectOperation {
        const partials: CompositeDisconnectPartial[] = [];
        for (const concreteEntity of entity.concreteEntities) {
            const partial = this.createCompositeDisconnectPartial(
                concreteEntity,
                relationship,
                input,
                context,
                callbackBucket
            );
            partials.push(partial);
        }

        return new CompositeDisconnectOperation({
            partials,
            target: entity,
        });
    }

    private createCompositeDisconnectPartial(
        entity: ConcreteEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext,
        callbackBucket: CallbackBucket
    ): CompositeDisconnectPartial {
        const disconnectOp = new CompositeDisconnectPartial({
            target: entity,
            selectionPattern: new RelationshipSelectionPattern({
                relationship,
                targetOverride: entity,
            }),
            relationship,
        });

        this.hydrateDisconnectOperation({
            target: entity,
            relationship,
            input,
            disconnect: disconnectOp,
            context,
            callbackBucket,
        });
        return disconnectOp;
    }

    private hydrateDisconnectOperation({
        target,
        relationship,
        input,
        disconnect,
        context,
        callbackBucket,
    }: {
        target: ConcreteEntityAdapter;
        relationship: RelationshipAdapter;
        input: Record<string, any>[];
        disconnect: DisconnectOperation;
        context: Neo4jGraphQLTranslationContext;
        callbackBucket: CallbackBucket;
    }) {
        this.addEntityAuthorization({
            entity: target,
            context,
            operation: disconnect,
        });

        if (isConcreteEntity(relationship.source)) {
            this.addSourceEntityAuthorization({
                entity: relationship.source,
                context,
                operation: disconnect,
            });
        }

        asArray(input).forEach((inputItem) => {
            const { whereArg, disconnectArg } = this.parseDisconnectArgs(inputItem);
            const nodeFilters: Filter[] = [];
            const edgeFilters: Filter[] = [];
            if (whereArg.node) {
                if (isConcreteEntity(relationship.target) || isUnionEntity(relationship.target)) {
                    nodeFilters.push(...this.queryASTFactory.filterFactory.createNodeFilters(target, whereArg.node));
                } else if (isInterfaceEntity(relationship.target)) {
                    nodeFilters.push(
                        ...this.queryASTFactory.filterFactory.createInterfaceNodeFilters({
                            entity: relationship.target,
                            targetEntity: target,
                            whereFields: whereArg.node,
                            relationship,
                        })
                    );
                }
            }
            if (whereArg.edge) {
                edgeFilters.push(...this.queryASTFactory.filterFactory.createEdgeFilters(relationship, whereArg.edge));
            }

            disconnect.addFilters(...nodeFilters, ...edgeFilters);

            asArray(disconnectArg).forEach((nestedDisconnectInputFields) => {
                Object.entries(nestedDisconnectInputFields).forEach(([key, value]) => {
                    const nestedRelationship = target.relationships.get(key);
                    if (!nestedRelationship) {
                        throw new Error("Expected relationship on connect operation. Please contact support");
                    }

                    const nestedEntity = nestedRelationship.target;

                    asArray(value).forEach((nestedDisconnectInputItem) => {
                        const nestedDisconnectOperation =
                            this.queryASTFactory.operationsFactory.createDisconnectOperation(
                                nestedEntity,
                                nestedRelationship,
                                nestedDisconnectInputItem,
                                context,
                                callbackBucket
                            );

                        const mutationOperationField = new MutationOperationField(nestedDisconnectOperation, key);
                        disconnect.addField(mutationOperationField, "node");
                    });
                });
            });

            const targetInputEdge = this.getInputEdge(inputItem, relationship);

            /* Create the attributes for the edge */
            raiseAttributeAmbiguity(Object.keys(targetInputEdge), relationship);
            for (const key of Object.keys(targetInputEdge)) {
                const attribute = relationship.attributes.get(key);
                if (attribute) {
                    const attachedTo = "relationship";

                    const paramInputField = new ParamInputField({
                        attachedTo,
                        attribute,
                        inputValue: targetInputEdge[key],
                    });
                    disconnect.addField(paramInputField, attachedTo);
                }
            }
        });
    }

    private addEntityAuthorization({
        entity,
        context,
        operation,
    }: {
        entity: ConcreteEntityAdapter;
        context: Neo4jGraphQLTranslationContext;
        operation: DisconnectOperation;
    }): void {
        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity,
            operations: ["DELETE_RELATIONSHIP"],
            context,
            afterValidation: true,
        });

        operation.addAuthFilters(...authFilters);
    }
    private addSourceEntityAuthorization({
        entity,
        context,
        operation,
    }: {
        entity: ConcreteEntityAdapter;
        context: Neo4jGraphQLTranslationContext;
        operation: DisconnectOperation;
    }): void {
        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity,
            operations: ["DELETE_RELATIONSHIP"],
            context,
            afterValidation: true,
        });

        operation.addSourceAuthFilters(...authFilters);
    }

    private getInputEdge(inputItem: Record<string, any>, relationship: RelationshipAdapter): Record<string, any> {
        const edge = inputItem.edge ?? {};

        // Deals with composite relationships
        if (relationship.propertiesTypeName && edge[relationship.propertiesTypeName]) {
            return edge[relationship.propertiesTypeName];
        }

        return edge;
    }

    private parseDisconnectArgs(args: Record<string, any>): {
        whereArg: { node: Record<string, any>; edge: Record<string, any> };
        disconnectArg: Record<string, any>[];
    } {
        const rawWhere = args.where ?? {};

        const whereArg = { node: rawWhere.node, edge: rawWhere.edge };
        const disconnectArg = args.disconnect ?? {};
        return { whereArg, disconnectArg };
    }
}
