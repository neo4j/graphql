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

import type { Context, RelationField } from "../../types";
import type { GraphQLCreateInput, TreeDescriptor } from "./types";
import { UnsupportedUnwindOptimization } from "./types";
import { GraphElement, Neo4jGraphQLError, Node, Relationship } from "../../classes";
import Cypher from "@neo4j/cypher-builder";
import { getRelationshipFields } from "./utils";
import { AST, CreateAST, NestedCreateAST } from "./GraphQLInputAST/GraphQLInputAST";
import mapToDbProperty from "../../utils/map-to-db-property";

export function inputTreeToCypherMap(
    input: GraphQLCreateInput[] | GraphQLCreateInput,
    node: Node,
    context: Context,
    parentKey?: string,
    relationship?: Relationship
): Cypher.List | Cypher.Map {
    if (Array.isArray(input)) {
        return new Cypher.List(
            input.map((GraphQLCreateInput: GraphQLCreateInput) =>
                inputTreeToCypherMap(GraphQLCreateInput, node, context, parentKey, relationship)
            )
        );
    }
    const properties = (Object.entries(input) as GraphQLCreateInput).reduce(
        (obj: Record<string, Cypher.Expr>, [key, value]: [string, Record<string, any>]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, {}, context);
            if (relationField && relationField.properties) {
                relationship = context.relationships.find(
                    (x) => x.properties === relationField.properties
                ) as unknown as Relationship;
            }
            let scalar = false;
            if (parentKey === "edge") {
                scalar = isScalar(key, relationship as Relationship);
            }
            // it assume that if parentKey is not defined then it means that the key belong to a Node
            else if (parentKey === "node" || parentKey === undefined) {
                scalar = isScalar(key, node);
            }
            if (typeof value === "object" && value !== null && (relationField || !scalar)) {
                if (Array.isArray(value)) {
                    obj[key] = new Cypher.List(
                        value.map((GraphQLCreateInput: GraphQLCreateInput) =>
                            inputTreeToCypherMap(
                                GraphQLCreateInput,
                                relationField ? relatedNodes[0] : node,
                                context,
                                key,
                                relationship
                            )
                        )
                    );
                    return obj;
                }
                obj[key] = inputTreeToCypherMap(
                    value as GraphQLCreateInput[] | GraphQLCreateInput,
                    relationField ? relatedNodes[0] : node,
                    context,
                    key,
                    relationship
                ) as Cypher.Map;
                return obj;
            }
            obj[key] = new Cypher.Param(value);
            return obj;
        },
        {} as Record<string, Cypher.Expr>
    ) as Record<string, Cypher.Expr>;
    return new Cypher.Map(properties);
}

function isScalar(fieldName: string, graphElement: GraphElement) {
    const scalarPredicate = (x) => x.fieldName === fieldName;
    const scalarFields = [
        graphElement.primitiveFields,
        graphElement.temporalFields,
        graphElement.pointFields,
        graphElement.scalarFields,
    ];
    return scalarFields.flat().some(scalarPredicate);
}

export function getTreeDescriptor(
    input: GraphQLCreateInput,
    node: Node,
    context: Context,
    parentKey?: string,
    relationship?: Relationship
): TreeDescriptor {
    return Object.entries(input).reduce(
        (previous, [key, value]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, value, context);
            if (relationField && relationField.properties) {
                relationship = context.relationships.find(
                    (x) => x.properties === relationField.properties
                ) as unknown as Relationship;
            }

            let scalar = false;
            if (parentKey === "edge") {
                scalar = isScalar(key, relationship as Relationship);
            }
            // it assume that if parentKey is not defined then it means that the key belong to a Node
            else if (parentKey === "node" || parentKey === undefined) {
                scalar = isScalar(key, node);
            }
            if (typeof value === "object" && value !== null && !scalar) {
                // TODO: supports union/interfaces
                const innerNode = relationField ? relatedNodes[0] : node;
                if (Array.isArray(value)) {
                    previous.childrens[key] = mergeTreeDescriptors(
                        value.map((el) => getTreeDescriptor(el as GraphQLCreateInput, innerNode, context, key, relationship))
                    );
                    return previous;
                }
                previous.childrens[key] = getTreeDescriptor(
                    value as GraphQLCreateInput,
                    innerNode,
                    context,
                    key,
                    relationship
                );
                return previous;
            }
            previous.properties.add(key);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

export function mergeTreeDescriptors(input: TreeDescriptor[]): TreeDescriptor {
    return input.reduce(
        (previous: TreeDescriptor, node: TreeDescriptor) => {
            previous.properties = new Set([...previous.properties, ...node.properties]);
            const entries = [...new Set([...Object.keys(previous.childrens), ...Object.keys(node.childrens)])].map(
                (childrenKey) => {
                    const previousChildren: TreeDescriptor =
                        previous.childrens[childrenKey] ?? ({ properties: new Set(), childrens: {} } as TreeDescriptor);
                    const nodeChildren: TreeDescriptor =
                        node.childrens[childrenKey] ?? ({ properties: new Set(), childrens: {} } as TreeDescriptor);
                    return [childrenKey, mergeTreeDescriptors([previousChildren, nodeChildren])];
                }
            );
            previous.childrens = Object.fromEntries(entries);
            return previous;
        },
        { properties: new Set(), childrens: {} } as TreeDescriptor
    );
}

function parser(input: TreeDescriptor, node: Node, context: Context, parentASTNode: AST): AST {
    if (node.auth) {
        throw new UnsupportedUnwindOptimization("Not supported operation: Auth");
    }
    Object.entries(input.childrens).forEach(([key, value]) => {
        const [relationField, relatedNodes] = getRelationshipFields(node, key, {}, context);

        if (relationField) {
            let edge;
            if (relationField.properties) {
                edge = context.relationships.find(
                    (x) => x.properties === relationField.properties
                ) as unknown as Relationship;
            }
            if (relationField.interface || relationField.union) {
                throw new UnsupportedUnwindOptimization(`Not supported operation: Interface or Union`);
            }
            Object.entries(value.childrens).forEach(([operation, description]) => {
                switch (operation) {
                    case "create":
                        parentASTNode.addChildren(
                            parseNestedCreate(
                                description,
                                relatedNodes[0],
                                context,
                                node,
                                key,
                                [relationField, relatedNodes],
                                edge
                            )
                        );
                        break;
                    /*
                    case "connect":
                         parentASTNode.addChildren(
                            parseConnect(description, relatedNodes[0], context, node, key, [
                                relationField,
                                relatedNodes,
                            ])
                        ); 
                        break;
                    case "connectOrCreate":
                         parentASTNode.addChildren(parseConnectOrCreate(description, relatedNodes[0], context, node)); 
                        break;
                    */
                    default:
                        throw new UnsupportedUnwindOptimization(`Not supported operation: ${operation}`);
                }
            });
        }
    });
    return parentASTNode;
}

function raiseAttributeAmbiguity(properties: Set<string> | Array<string>, graphElement: GraphElement) {
    const hash = {};
    properties.forEach((property) => {
        const dbName = mapToDbProperty(graphElement, property);
        if (hash[dbName]) {
            throw new Neo4jGraphQLError(
                `Conflicting modification of ${[hash[dbName], property].map((n) => `[[${n}]]`).join(", ")} on type ${
                    graphElement.name
                }`
            );
        }
        hash[dbName] = property;
    });
}

function raiseOnNotSupportedProperty(graphElement: GraphElement) {
    graphElement.primitiveFields.forEach((property) => {
        if (property.callback && property.callback.operations.includes("CREATE")) {
            throw new UnsupportedUnwindOptimization("Not supported operation: Callback");
        }
        if (property.auth) {
            throw new UnsupportedUnwindOptimization("Not supported operation: Auth");
        }
    });
}

export function parseCreate(input: TreeDescriptor, node: Node, context: Context) {
    const nodeProperties = input.properties;
    raiseOnNotSupportedProperty(node);
    raiseAttributeAmbiguity(input.properties, node);
    const createAST = new CreateAST([...nodeProperties], node);
    parser(input, node, context, createAST);
    return createAST;
}

function parseNestedCreate(
    input: TreeDescriptor,
    node: Node,
    context: Context,
    parentNode: Node,
    relationshipPropertyPath: string,
    relationship: [RelationField | undefined, Node[]],
    edge?: Relationship
) {
    const nodeProperties = input.childrens.node.properties;
    const edgeProperties = input.childrens.edge ? input.childrens.edge.properties : [];
    raiseOnNotSupportedProperty(node);
    raiseAttributeAmbiguity(nodeProperties, node);
    if (edge) {
        raiseOnNotSupportedProperty(edge);
        raiseAttributeAmbiguity(edgeProperties, edge);
    }

    const nestedCreateAST = new NestedCreateAST(
        node,
        parentNode,
        [...nodeProperties],
        [...edgeProperties],
        relationshipPropertyPath,
        relationship,
        edge
    );
    if (input.childrens.node) {
        parser(input.childrens.node, node, context, nestedCreateAST);
    }
    return nestedCreateAST;
}
