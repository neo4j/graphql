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
import { Relationship } from "../../../schema-model/relationship/Relationship";
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

/** Parse a resolveTree into a Neo4j GraphQLTree */
export function parseResolveInfoTree({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): GraphQLTree {
    const entityTypes = entity.types;
    const connectionResolveTree = findFieldByName(resolveTree, entityTypes.connectionOperation, "connection");

    const connection = connectionResolveTree
        ? parseConnection({ resolveTree: connectionResolveTree, entity })
        : undefined;

    const result = {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: {
            connection,
        },
    };
    return result;
}

function parseConnection({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): GraphQLTreeConnection {
    const entityTypes = entity.types;
    const edgesResolveTree = findFieldByName(resolveTree, entityTypes.connectionType, "edges");
    const edgeResolveTree = edgesResolveTree ? parseEdges({ resolveTree: edgesResolveTree, entity }) : undefined;
    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: {
            edges: edgeResolveTree,
        },
    };
}

function parseEdges({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): GraphQLTreeEdge {
    const entityTypes = entity.types;
    const edgeType = entityTypes.edgeType;
    let target = entity;
    if (entity instanceof Relationship) {
        target = entity.target as ConcreteEntity;
    }
    const nodeResolveTree = findFieldByName(resolveTree, edgeType, "node");
    const propertiesResolveTree = findFieldByName(resolveTree, entityTypes.edgeType, "properties");
    const node = nodeResolveTree ? parseNode({ resolveTree: nodeResolveTree, entity: target }) : undefined;
    const properties = propertiesResolveTree
        ? parseRelationshipProperties({ resolveTree: propertiesResolveTree, entity })
        : undefined;

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: {
            node: node,
            properties: properties,
        },
    };
}

function parseNode({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): GraphQLTreeNode {
    const entityTypes = entity.types;
    const fieldsResolveTree = resolveTree.fieldsByTypeName[entityTypes.nodeType] ?? {};
    const fields = parseEntityFields({ resolveTrees: Object.values(fieldsResolveTree), entity });

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: fields,
    };
}

function parseRelationshipProperties({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): GraphQLTreeProperties | undefined {
    if (!entity.types.propertiesType) {
        return;
    }
    const fieldsResolveTree = resolveTree.fieldsByTypeName[entity.types.propertiesType] ?? {};

    const fields = parseEntityFields({ resolveTrees: Object.values(fieldsResolveTree), entity });

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: fields,
    };
}

function parseEntityFields({
    resolveTrees,
    entity,
}: {
    resolveTrees: ResolveTree[];
    entity: ConcreteEntity | Relationship;
}): Record<string, GraphQLTreeLeafField> {
    return Object.fromEntries(
        resolveTrees.map((resolveTree): [string, GraphQLTreeLeafField] => {
            const fieldName = resolveTree.name;
            const field = parseRelationship({ resolveTree, entity }) ?? parseAttributeField({ resolveTree, entity });
            if (!field) {
                throw new ResolveTreeParserError(`${fieldName} is not an attribute nor relationship`);
            }

            return field;
        })
    );
}

function parseAttributeField({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): [string, GraphQLTreeLeafField] | undefined {
    if (entity.hasAttribute(resolveTree.name)) {
        return [
            resolveTree.name,
            {
                alias: resolveTree.alias,
                args: resolveTree.args,
            },
        ];
    }
}

function parseRelationship({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): [string, GraphQLTreeReadOperation] | undefined {
    if (entity instanceof Relationship) {
        return;
    }
    if (entity.hasRelationship(resolveTree.name)) {
        const relationship = entity.findRelationship(resolveTree.name);
        if (!relationship) {
            throw new ResolveTreeParserError("Relationship not found");
        }
        const nestedConnection = parseResolveInfoTree({ resolveTree, entity: relationship });
        return [resolveTree.name, nestedConnection];
    }
}

class ResolveTreeParserError extends Error {}
