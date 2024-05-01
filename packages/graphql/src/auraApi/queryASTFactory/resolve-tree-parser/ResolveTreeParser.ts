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

import type { ResolveTree } from "graphql-parse-resolve-info";
import { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import type { RelationshipTypeNames } from "../../graphQLTypeNames/NestedEntityTypeNames";
import type { TopLevelEntityTypeNames } from "../../graphQLTypeNames/TopLevelEntityTypeNames";
import { findFieldByName } from "./find-field-by-name";
import type {
    GraphQLTree,
    GraphQLTreeConnection,
    GraphQLTreeEdge,
    GraphQLTreeLeafField,
    GraphQLTreeNode,
    GraphQLTreeProperties,
    GraphQLTreeReadOperation,
} from "./graphql-tree";

export class ResolveTreeParser {
    private operations: TopLevelEntityTypeNames;
    private entity: ConcreteEntity;

    constructor(entity: ConcreteEntity) {
        this.entity = entity;
        this.operations = entity.types;
    }

    public parse(resolveTree: ResolveTree): GraphQLTree {
        const connectionResolveTree = findFieldByName(resolveTree, this.operations.connectionOperation, "connection");

        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;

        const result = {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
        return result;
    }

    private parseConnection(connectionResolveTree: ResolveTree): GraphQLTreeConnection {
        const edgesResolveTree = findFieldByName(connectionResolveTree, this.operations.connectionType, "edges");
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(connectionResolveTree: ResolveTree): GraphQLTreeEdge {
        const nodeResolveTree = findFieldByName(connectionResolveTree, this.operations.edgeType, "node");

        const node = nodeResolveTree ? this.parseEntity(nodeResolveTree) : undefined;

        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                node: node,
            },
        };
    }

    public parseEntity(nodeResolveTree: ResolveTree): GraphQLTreeNode {
        const fieldsResolveTree = nodeResolveTree.fieldsByTypeName[this.operations.nodeType] ?? {};
        const fields = Object.fromEntries(
            Object.values(fieldsResolveTree).map((f): [string, GraphQLTreeLeafField | GraphQLTreeReadOperation] => {
                const fieldName = f.name;
                if (this.entity.hasRelationship(fieldName)) {
                    const result = this.parseRelationship(f);
                    return [fieldName, result];
                }
                if (this.entity.hasAttribute(fieldName)) {
                    return [
                        fieldName,
                        {
                            alias: f.alias,
                            args: f.args,
                        },
                    ];
                }
                throw new ResolveTreeParserError(`${fieldName} is not an attribute nor relationship`);
            })
        );

        return {
            alias: nodeResolveTree.alias,
            args: nodeResolveTree.args,
            fields: fields,
        };
    }

    private parseRelationship(resolveTree: ResolveTree): GraphQLTreeReadOperation {
        const relationship = this.entity.findRelationship(resolveTree.name);
        if (!relationship) {
            throw new ResolveTreeParserError("Relationship not found");
        }

        const relationshipOperations = this.operations.relationship(relationship);
        const relationshipParser = new RelationshipResolveTreeParser(relationship, relationshipOperations);
        return relationshipParser.parse(resolveTree);
    }
}

class RelationshipResolveTreeParser {
    private operations: RelationshipTypeNames;
    private relationship: Relationship;

    constructor(relationship: Relationship, operations: RelationshipTypeNames) {
        this.operations = operations;
        this.relationship = relationship;
    }

    public parse(resolveTree: ResolveTree): GraphQLTreeReadOperation {
        const connectionResolveTree = findFieldByName(resolveTree, this.operations.connectionOperation, "connection");
        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
    }

    private parseConnection(connectionResolveTree: ResolveTree): GraphQLTreeConnection {
        const edgesResolveTree = findFieldByName(connectionResolveTree, this.operations.connectionType, "edges");
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(connectionResolveTree: ResolveTree): GraphQLTreeEdge {
        const nodeResolveTree = findFieldByName(connectionResolveTree, this.operations.edgeType, "node");
        const propertiesResolveTree = findFieldByName(connectionResolveTree, this.operations.edgeType, "properties");

        const node = nodeResolveTree ? this.parseEntity(nodeResolveTree) : undefined;
        const properties = propertiesResolveTree ? this.parseRelationshipProperties(propertiesResolveTree) : undefined;

        return {
            alias: connectionResolveTree.alias,
            args: connectionResolveTree.args,
            fields: {
                node: node,
                properties: properties,
            },
        };
    }

    private parseEntity(resolveTree: ResolveTree): GraphQLTreeNode {
        const target = this.relationship.target;
        if (!(target instanceof ConcreteEntity)) {
            throw new Error("Interface not supported");
        }

        const resolveTreeParser = new ResolveTreeParser(target);
        const result = resolveTreeParser.parseEntity(resolveTree);

        return result;
    }

    private parseRelationshipProperties(resolveTree: ResolveTree): GraphQLTreeProperties | undefined {
        if (!this.operations.propertiesType) return undefined;
        const fieldsResolveTree = resolveTree.fieldsByTypeName[this.operations.propertiesType] ?? {};
        const fields = Object.fromEntries(
            Object.values(fieldsResolveTree).map((f): [string, GraphQLTreeLeafField] => {
                const fieldName = f.name;
                if (this.relationship.hasAttribute(fieldName)) {
                    return [
                        fieldName,
                        {
                            alias: f.alias,
                            args: f.args,
                        },
                    ];
                }
                throw new ResolveTreeParserError(`${fieldName} is not an attribute of the relationship`);
            })
        );

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: fields,
        };
    }
}

class ResolveTreeParserError extends Error {}
