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

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import type { UnionEntityAdapter } from "../../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { RelationshipAdapter } from "../../../../schema-model/relationship/model-adapters/RelationshipAdapter";
import type { Neo4jGraphQLTranslationContext } from "../../../../types/neo4j-graphql-translation-context";
import { asArray } from "../../../../utils/utils";
import type { Filter } from "../../ast/filters/Filter";
import { MutationOperationField } from "../../ast/input-fields/MutationOperationField";
import { ParamInputField } from "../../ast/input-fields/ParamInputField";
import { CompositeConnectOperation } from "../../ast/operations/composite/CompositeConnectOperation";
import { CompositeConnectPartial } from "../../ast/operations/composite/CompositeConnectPartial";
import { ConnectOperation } from "../../ast/operations/ConnectOperation";
import { NodeSelectionPattern } from "../../ast/selection/SelectionPattern/NodeSelectionPattern";
import type { CallbackBucket } from "../../utils/callback-bucket";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
import { isUnionEntity } from "../../utils/is-union-entity";
import { raiseAttributeAmbiguity } from "../../utils/raise-attribute-ambiguity";
import type { QueryASTFactory } from "../QueryASTFactory";

export class ConnectFactory {
    private queryASTFactory: QueryASTFactory;

    constructor(queryASTFactory: QueryASTFactory) {
        this.queryASTFactory = queryASTFactory;
    }

    public createConnectOperation(
        entity: ConcreteEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext,
        callbackBucket: CallbackBucket
    ): ConnectOperation {
        const connectOP = new ConnectOperation({
            target: entity,
            selectionPattern: new NodeSelectionPattern({
                target: entity,
            }),
            relationship,
        });

        this.hydrateConnectOperation({
            target: entity,
            relationship,
            input,
            connect: connectOP,
            context,
            callbackBucket,
        });
        return connectOP;
    }

    public createCompositeConnectOperation(
        entity: InterfaceEntityAdapter | UnionEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext,
        callbackBucket: CallbackBucket
    ): CompositeConnectOperation {
        const partials: CompositeConnectPartial[] = [];
        for (const concreteEntity of entity.concreteEntities) {
            const partial = this.createCompositeConnectPartial(
                concreteEntity,
                relationship,
                input,
                context,
                callbackBucket
            );
            partials.push(partial);
        }

        return new CompositeConnectOperation({
            partials,
            target: entity,
        });
    }

    private createCompositeConnectPartial(
        entity: ConcreteEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext,
        callbackBucket: CallbackBucket
    ): CompositeConnectPartial {
        const connectOP = new CompositeConnectPartial({
            target: entity,
            selectionPattern: new NodeSelectionPattern({
                target: entity,
            }),
            relationship,
        });

        this.hydrateConnectOperation({
            target: entity,
            relationship,
            input,
            connect: connectOP,
            context,
            callbackBucket,
        });
        return connectOP;
    }

    private hydrateConnectOperation({
        target,
        relationship,
        input,
        connect,
        context,
        callbackBucket,
    }: {
        target: ConcreteEntityAdapter;
        relationship: RelationshipAdapter;
        input: Record<string, any>[];
        connect: ConnectOperation;
        context: Neo4jGraphQLTranslationContext;
        callbackBucket: CallbackBucket;
    }) {
        this.addEntityAuthorization({
            entity: target,
            context,
            operation: connect,
        });
        if (isConcreteEntity(relationship.source)) {
            this.addSourceEntityAuthorization({
                entity: relationship.source,
                context,
                operation: connect,
            });
        }

        asArray(input).forEach((inputItem) => {
            const { whereArg, connectArg } = this.parseConnectArgs(inputItem);
            const nodeFilters: Filter[] = [];
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

            connect.addFilters(...nodeFilters);

            asArray(connectArg).forEach((nestedConnectInputFields) => {
                Object.entries(nestedConnectInputFields).forEach(([key, value]) => {
                    const nestedRelationship = target.relationships.get(key);
                    if (!nestedRelationship) {
                        throw new Error("Expected relationship on connect operation. Please contact support");
                    }

                    const nestedEntity = nestedRelationship.target;

                    asArray(value).forEach((nestedConnectInputItem) => {
                        const nestedConnectOperation = this.queryASTFactory.operationsFactory.createConnectOperation(
                            nestedEntity,
                            nestedRelationship,
                            nestedConnectInputItem,
                            context,
                            callbackBucket
                        );

                        const mutationOperationField = new MutationOperationField(nestedConnectOperation, key);
                        connect.addField(mutationOperationField, "node");
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
                    connect.addField(paramInputField, attachedTo);
                }
            }
        });

        this.addPopulatedByFieldToConnect({
            connect,
            input,
            callbackBucket,
            relationship,
        });
    }

    private addPopulatedByFieldToConnect({
        connect,
        input,
        callbackBucket,
        relationship,
    }: {
        connect: ConnectOperation;
        input: Record<string, any>;
        callbackBucket: CallbackBucket;
        relationship?: RelationshipAdapter;
    }) {
        // Using create here because the relationship is created on connect
        relationship?.getPopulatedByFields("CREATE").forEach((attribute) => {
            const attachedTo = "relationship";
            // the param value it's irrelevant as it will be overwritten by the callback function
            const relCallbackParam = new Cypher.Param("");
            const relField = new ParamInputField({
                attribute,
                attachedTo,
                inputValue: relCallbackParam,
            });
            connect.addField(relField, "relationship");

            const callbackFunctionName = attribute.annotations.populatedBy?.callback;
            if (!callbackFunctionName) {
                throw new Error(`PopulatedBy callback not found for attribute ${attribute.name}`);
            }

            callbackBucket.addCallback({
                functionName: callbackFunctionName,
                param: relCallbackParam,
                parent: input.edge,
                type: attribute.type,
                operation: "UPDATE",
            });
        });
    }

    private addEntityAuthorization({
        entity,
        context,
        operation,
    }: {
        entity: ConcreteEntityAdapter;
        context: Neo4jGraphQLTranslationContext;
        operation: ConnectOperation;
    }): void {
        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity,
            operations: ["CREATE_RELATIONSHIP"],
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
        operation: ConnectOperation;
    }): void {
        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity,
            operations: ["CREATE_RELATIONSHIP"],
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

    private parseConnectArgs(args: Record<string, any>): {
        whereArg: { node: Record<string, any>; edge: Record<string, any> };
        connectArg: Record<string, any>[];
    } {
        const rawWhere = args.where ?? {};

        const whereArg = { node: rawWhere.node, edge: {} };
        const connectArg = args.connect ?? {};
        return { whereArg, connectArg };
    }
}
