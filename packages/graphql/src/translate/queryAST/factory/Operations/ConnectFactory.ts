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
import { CompositeConnectOperation } from "../../ast/operations/composite/CompositeConnectOperation";
import { CompositeConnectPartial } from "../../ast/operations/composite/CompositeConnectPartial";
import { ConnectOperation } from "../../ast/operations/ConnectOperation";
import { NodeSelectionPattern } from "../../ast/selection/SelectionPattern/NodeSelectionPattern";
import { isConcreteEntity } from "../../utils/is-concrete-entity";
import { isInterfaceEntity } from "../../utils/is-interface-entity";
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
        context: Neo4jGraphQLTranslationContext
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
        });
        return connectOP;
    }

    public createCompositeConnectOperation(
        entity: InterfaceEntityAdapter | UnionEntityAdapter,
        relationship: RelationshipAdapter,
        input: Record<string, any>[],
        context: Neo4jGraphQLTranslationContext
    ): CompositeConnectOperation {
        const partials: CompositeConnectPartial[] = [];
        for (const concreteEntity of entity.concreteEntities) {
            const partial = this.createCompositeConnectPartial(concreteEntity, relationship, input, context);
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
        context: Neo4jGraphQLTranslationContext
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
        });
        return connectOP;
    }

    private hydrateConnectOperation({
        target,
        relationship,
        input,
        connect,
        context,
    }: {
        target: ConcreteEntityAdapter;
        relationship: RelationshipAdapter;
        input: Record<string, any>[];
        connect: ConnectOperation;
        context: Neo4jGraphQLTranslationContext;
    }) {
        this.addEntityAuthorization({
            entity: target,
            context,
            operation: connect,
        });

        const authFilters = this.queryASTFactory.authorizationFactory.getAuthFilters({
            entity: target,
            operations: ["CREATE_RELATIONSHIP"],
            context,
        });

        connect.addFilters(...authFilters);

        asArray(input).forEach((inputItem) => {
            const { whereArg, connectArg } = this.parseConnectArgs(inputItem);
            const nodeFilters: Filter[] = [];
            if (whereArg.node) {
                if (isConcreteEntity(relationship.target)) {
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
                            context
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
        const authFilters = this.queryASTFactory.authorizationFactory.createAuthValidateRule({
            entity,
            authAnnotation: entity.annotations.authorization,
            when: "AFTER",
            operations: ["CREATE_RELATIONSHIP"],
            context,
        });

        if (authFilters) {
            operation.addAuthFilters(authFilters);
        }
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
