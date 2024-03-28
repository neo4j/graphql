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
import type { GraphElement, Node, Relationship } from "../../classes";
import { Neo4jGraphQLError } from "../../classes";
import type { RelationField } from "../../types";
import type { Neo4jGraphQLTranslationContext } from "../../types/neo4j-graphql-translation-context";
import mapToDbProperty from "../../utils/map-to-db-property";
import type { UnwindASTNode } from "./GraphQLInputAST/GraphQLInputAST";
import { CreateAST, NestedCreateAST } from "./GraphQLInputAST/GraphQLInputAST";
import type { GraphQLCreateInput, TreeDescriptor } from "./types";
import { UnsupportedUnwindOptimization } from "./types";

function getRelationshipFields(
    node: Node,
    key: string,
    context: Neo4jGraphQLTranslationContext
): [RelationField | undefined, Node[]] {
    const relationField = node.relationFields.find((x) => key === x.fieldName);
    const refNodes: Node[] = [];

    if (relationField) {
        if (relationField.interface || relationField.union) {
            throw new UnsupportedUnwindOptimization(`Not supported operation: Interface or Union`);
        } else {
            const node = context.nodes.find((x) => x.name === relationField.typeMeta.name);
            if (node) {
                refNodes.push(node);
            }
        }
    }
    return [relationField, refNodes];
}

export function inputTreeToCypherMap(
    input: GraphQLCreateInput[] | GraphQLCreateInput,
    node: Node,
    context: Neo4jGraphQLTranslationContext,
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
    const properties = Object.entries(input).reduce(
        (obj: Record<string, Cypher.Expr>, [key, value]: [string, Record<string, any>]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, context);
            if (relationField && relationField.properties) {
                relationship = context.relationships.find((x) => x.properties === relationField.properties);
            }
            let scalarOrEnum = false;
            if (parentKey === "edge") {
                if (!relationship) {
                    throw new Error("Transpile error: relationship expected to be defined");
                }
                scalarOrEnum = isScalarOrEnum(key, relationship);
            }
            // it assume that if parentKey is not defined then it means that the key belong to a Node
            else if (parentKey === "node" || parentKey === undefined) {
                scalarOrEnum = isScalarOrEnum(key, node);
            }
            if (typeof value === "object" && value !== null && (relationField || !scalarOrEnum)) {
                const nodeInput = relationField ? (relatedNodes[0] as Node) : node;
                if (Array.isArray(value)) {
                    obj[key] = new Cypher.List(
                        value.map((GraphQLCreateInput: GraphQLCreateInput) =>
                            inputTreeToCypherMap(GraphQLCreateInput, nodeInput, context, key, relationship)
                        )
                    );
                    return obj;
                }
                obj[key] = inputTreeToCypherMap(value, nodeInput, context, key, relationship);
                return obj;
            }
            obj[key] = new Cypher.Param(value);
            return obj;
        },
        {}
    );
    return new Cypher.Map(properties);
}

function isScalarOrEnum(fieldName: string, graphElement: GraphElement) {
    const scalarOrEnumPredicate = (x) => x.fieldName === fieldName;
    const scalarOrEnumFields = [
        graphElement.primitiveFields,
        graphElement.temporalFields,
        graphElement.pointFields,
        graphElement.scalarFields,
        graphElement.enumFields,
    ];
    return scalarOrEnumFields.flat().some(scalarOrEnumPredicate);
}

export function getTreeDescriptor(
    input: GraphQLCreateInput,
    node: Node,
    context: Neo4jGraphQLTranslationContext,
    parentKey?: string,
    relationship?: Relationship
): TreeDescriptor {
    return Object.entries(input).reduce<TreeDescriptor>(
        (previous, [key, value]) => {
            const [relationField, relatedNodes] = getRelationshipFields(node, key, context);
            if (relationField && relationField.properties) {
                relationship = context.relationships.find((x) => x.properties === relationField.properties);
            }

            let scalarOrEnum = false;
            if (parentKey === "edge") {
                if (!relationship) {
                    throw new Error("Transpile error: relationship expected to be defined");
                }
                scalarOrEnum = isScalarOrEnum(key, relationship);
            }
            // it assume that if parentKey is not defined then it means that the key belong to a Node
            else if (parentKey === "node" || parentKey === undefined) {
                scalarOrEnum = isScalarOrEnum(key, node);
            }
            if (typeof value === "object" && value !== null && !scalarOrEnum) {
                // TODO: supports union/interfaces
                const innerNode = relationField && relatedNodes[0] ? relatedNodes[0] : node;

                if (Array.isArray(value)) {
                    previous.children[key] = mergeTreeDescriptors(
                        value.map((el) => getTreeDescriptor(el, innerNode, context, key, relationship))
                    );
                    return previous;
                }
                previous.children[key] = getTreeDescriptor(value, innerNode, context, key, relationship);
                return previous;
            }
            previous.properties.add(key);
            return previous;
        },
        { properties: new Set<string>(), children: {} }
    );
}

export function mergeTreeDescriptors(input: TreeDescriptor[]): TreeDescriptor {
    return input.reduce(
        (previous: TreeDescriptor, node: TreeDescriptor) => {
            previous.properties = new Set([...previous.properties, ...node.properties]);
            const entries = [...new Set([...Object.keys(previous.children), ...Object.keys(node.children)])].map(
                (childrenKey) => {
                    const previousChildren: TreeDescriptor = previous.children[childrenKey] ?? {
                        properties: new Set(),
                        children: {},
                    };
                    const nodeChildren: TreeDescriptor = node.children[childrenKey] ?? {
                        properties: new Set(),
                        children: {},
                    };
                    return [childrenKey, mergeTreeDescriptors([previousChildren, nodeChildren])];
                }
            );
            previous.children = Object.fromEntries(entries);
            return previous;
        },
        { properties: new Set<string>(), children: {} }
    );
}

function parser(
    input: TreeDescriptor,
    node: Node,
    context: Neo4jGraphQLTranslationContext,
    parentASTNode: UnwindASTNode,
    counter: number
): UnwindASTNode {
    Object.entries(input.children).forEach(([key, value]) => {
        const [relationField, relatedNodes] = getRelationshipFields(node, key, context);

        if (relationField) {
            let edge;
            if (relationField.properties) {
                edge = context.relationships.find((x) => x.properties === relationField.properties);
                if (!edge) {
                    throw new Error("Transpile error: relationship expected to be defined");
                }
            }
            if (relationField.interface || relationField.union) {
                throw new UnsupportedUnwindOptimization(`Not supported operation: Interface or Union`);
            }
            Object.entries(value.children).forEach(([operation, description]) => {
                switch (operation) {
                    case "create":
                        parentASTNode.addChildren(
                            parseNestedCreate(
                                description,
                                relatedNodes[0] as Node,
                                context,
                                node,
                                key,
                                [relationField, relatedNodes],
                                counter++,
                                edge
                            )
                        );
                        break;

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
    });
}

export function parseCreate(input: TreeDescriptor, node: Node, context: Neo4jGraphQLTranslationContext, counter = 0) {
    const nodeProperties = input.properties;
    raiseOnNotSupportedProperty(node);
    raiseAttributeAmbiguity(input.properties, node);
    const createAST = new CreateAST(counter++, [...nodeProperties], node);
    parser(input, node, context, createAST, counter);
    return createAST;
}

function parseNestedCreate(
    input: TreeDescriptor,
    node: Node,
    context: Neo4jGraphQLTranslationContext,
    parentNode: Node,
    relationshipPropertyPath: string,
    relationship: [RelationField | undefined, Node[]],
    counter: number,
    edge?: Relationship
) {
    if (!relationship[0]) {
        throw new Error("what?");
    }
    if (!input.children.node) {
        throw new Error("Transpile error: node expected to be defined");
    }
    const nodeProperties = input.children.node.properties;
    const edgeProperties = input.children.edge ? input.children.edge.properties : [];
    raiseOnNotSupportedProperty(node);
    raiseAttributeAmbiguity(nodeProperties, node);
    if (edge) {
        raiseOnNotSupportedProperty(edge);
        raiseAttributeAmbiguity(edgeProperties, edge);
    }

    const nestedCreateAST = new NestedCreateAST(
        counter++,
        node,
        parentNode,
        [...nodeProperties],
        [...edgeProperties],
        relationshipPropertyPath,
        relationship,
        edge
    );
    if (input.children.node) {
        parser(input.children.node, node, context, nestedCreateAST, counter);
    }
    return nestedCreateAST;
}
