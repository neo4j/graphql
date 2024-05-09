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
import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import { findFieldByName } from "./find-field-by-name";
import type {
    GraphQLConnectionArgs,
    GraphQLSortArgument,
    GraphQLTree,
    GraphQLTreeConnection,
    GraphQLTreeEdge,
    GraphQLTreeEdgeProperties,
    GraphQLTreeLeafField,
    GraphQLTreeNode,
    GraphQLTreeReadOperation,
} from "./graphql-tree";

export function parseResolveInfoTree({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity;
}): GraphQLTree {
    const parser = new TopLevelTreeParser({ entity });
    return parser.parseOperation(resolveTree);
}

abstract class ResolveTreeParser<T extends ConcreteEntity | Relationship> {
    protected entity: T;

    constructor({ entity }: { entity: T }) {
        this.entity = entity;
    }

    /** Parse a resolveTree into a Neo4j GraphQLTree */
    public parseOperation(resolveTree: ResolveTree): GraphQLTreeReadOperation {
        const connectionResolveTree = findFieldByName(resolveTree, this.entity.types.connectionOperation, "connection");

        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                connection,
            },
        };
    }

    protected abstract get targetNode(): ConcreteEntity;

    private parseConnection(resolveTree: ResolveTree): GraphQLTreeConnection {
        const entityTypes = this.entity.types;
        const edgesResolveTree = findFieldByName(resolveTree, entityTypes.connectionType, "edges");
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        const connectionArgs = this.parseConnectionArgs(resolveTree.args);
        return {
            alias: resolveTree.alias,
            args: connectionArgs,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseEdges(resolveTree: ResolveTree): GraphQLTreeEdge {
        const edgeType = this.entity.types.edgeType;

        const nodeResolveTree = findFieldByName(resolveTree, edgeType, "node");
        const resolveTreeProperties = findFieldByName(resolveTree, edgeType, "properties");

        const node = nodeResolveTree ? this.parseNode(nodeResolveTree) : undefined;
        const properties = resolveTreeProperties ? this.parseEdgeProperties(resolveTreeProperties) : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                node: node,
                properties: properties,
            },
        };
    }

    private parseNode(resolveTree: ResolveTree): GraphQLTreeNode {
        const entityTypes = this.targetNode.types;
        const fieldsResolveTree = resolveTree.fieldsByTypeName[entityTypes.nodeType] ?? {};

        const fields = this.getNodeFields(fieldsResolveTree);

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: fields,
        };
    }

    private getNodeFields(
        fields: Record<string, ResolveTree>
    ): Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation> {
        const propertyFields: Record<string, GraphQLTreeLeafField | GraphQLTreeReadOperation> = {};
        for (const fieldResolveTree of Object.values(fields)) {
            const fieldName = fieldResolveTree.name;
            const field =
                this.parseRelationshipField(fieldResolveTree, this.targetNode) ??
                this.parseAttributeField(fieldResolveTree, this.targetNode);
            if (!field) {
                throw new ResolveTreeParserError(`${fieldName} is not a field of node`);
            }
            propertyFields[fieldName] = field;
        }
        return propertyFields;
    }

    private parseEdgeProperties(resolveTree: ResolveTree): GraphQLTreeEdgeProperties | undefined {
        if (!this.entity.types.propertiesType) {
            return undefined;
        }
        const fieldsResolveTree = resolveTree.fieldsByTypeName[this.entity.types.propertiesType] ?? {};

        const fields = this.getEdgePropertyFields(fieldsResolveTree);

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: fields,
        };
    }

    private getEdgePropertyFields(fields: Record<string, ResolveTree>): Record<string, GraphQLTreeLeafField> {
        const propertyFields: Record<string, GraphQLTreeLeafField> = {};
        for (const fieldResolveTree of Object.values(fields)) {
            const fieldName = fieldResolveTree.name;
            const field = this.parseAttributeField(fieldResolveTree, this.entity);
            if (!field) {
                throw new ResolveTreeParserError(`${fieldName} is not an attribute of edge`);
            }
            propertyFields[fieldName] = field;
        }
        return propertyFields;
    }

    private parseAttributeField(
        resolveTree: ResolveTree,
        entity: ConcreteEntity | Relationship
    ): GraphQLTreeLeafField | undefined {
        if (entity.hasAttribute(resolveTree.name)) {
            return {
                alias: resolveTree.alias,
                args: resolveTree.args,
                fields: undefined,
            };
        }
    }

    private parseRelationshipField(
        resolveTree: ResolveTree,
        entity: ConcreteEntity
    ): GraphQLTreeReadOperation | undefined {
        const relationship = entity.findRelationship(resolveTree.name);
        if (!relationship) {
            return;
        }
        const relationshipTreeParser = new RelationshipResolveTreeParser({ entity: relationship });
        return relationshipTreeParser.parseOperation(resolveTree);
    }

    private parseConnectionArgs(resolveTreeArgs: { [str: string]: any }): GraphQLConnectionArgs {
        if (!resolveTreeArgs.sort) {
            return {};
        }

        return {
            sort: this.parseSort(resolveTreeArgs.sort),
        };
    }

    private parseSort(sortArguments: { edges: { node: Record<string, any> } }[]): GraphQLSortArgument[] {
        return sortArguments.map((sortArgument) => {
            const edges = sortArgument.edges;
            const node = edges.node;

            const fields = Object.fromEntries(
                Object.entries(node).map(([fieldName, resolveTreeDirection]) => {
                    if (this.entity.hasAttribute(fieldName)) {
                        const direction = this.parseDirection(resolveTreeDirection);
                        return [fieldName, direction];
                    }
                    throw new ResolveTreeParserError(`Invalid sort field: ${fieldName}`);
                })
            );

            return {
                edges: {
                    node: fields,
                },
            };
        });
    }

    private parseDirection(direction: string): "ASC" | "DESC" {
        if (direction === "ASC" || direction === "DESC") {
            return direction;
        }
        throw new ResolveTreeParserError(`Invalid sort direction: ${direction}`);
    }
}

class TopLevelTreeParser extends ResolveTreeParser<ConcreteEntity> {
    protected get targetNode(): ConcreteEntity {
        return this.entity;
    }
}

class RelationshipResolveTreeParser extends ResolveTreeParser<Relationship> {
    protected get targetNode(): ConcreteEntity {
        return this.entity.target as ConcreteEntity;
    }
}

class ResolveTreeParserError extends Error {}
