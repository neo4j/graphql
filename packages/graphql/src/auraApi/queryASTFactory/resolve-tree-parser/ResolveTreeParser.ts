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
    return parseOperation({ resolveTree, entity });
}

/** Parse a resolveTree into a Neo4j GraphQLTree */
export function parseOperation({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity | Relationship;
}): GraphQLTreeReadOperation {
    const connectionResolveTree = findFieldByName(resolveTree, entity.types.connectionOperation, "connection");

    const connection = connectionResolveTree
        ? parseConnection({ resolveTree: connectionResolveTree, entity })
        : undefined;

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: {
            connection,
        },
    };
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
    const edgeType = entity.types.edgeType;

    const target = (entity instanceof Relationship ? entity.target : entity) as ConcreteEntity;

    const nodeResolveTree = findFieldByName(resolveTree, edgeType, "node");

    const node = nodeResolveTree ? parseNode({ resolveTree: nodeResolveTree, entity: target }) : undefined;

    let properties: GraphQLTreeProperties | undefined;

    if (entity instanceof Relationship) {
        const propertiesResolveTree = findFieldByName(resolveTree, edgeType, "properties");
        properties = propertiesResolveTree
            ? parseRelationshipProperties({ resolveTree: propertiesResolveTree, entity })
            : undefined;
    }

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: {
            node: node,
            properties: properties,
        },
    };
}

function parseNode({ resolveTree, entity }: { resolveTree: ResolveTree; entity: ConcreteEntity }): GraphQLTreeNode {
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
    entity: Relationship;
}): GraphQLTreeProperties | undefined {
    if (!entity.types.propertiesType) {
        return;
    }
    const fieldsResolveTree = resolveTree.fieldsByTypeName[entity.types.propertiesType] ?? {};

    const fields = parseRelationshipFields({ resolveTrees: Object.values(fieldsResolveTree), entity });

    return {
        alias: resolveTree.alias,
        args: resolveTree.args,
        fields: fields,
    };
}

function parseRelationshipFields({
    resolveTrees,
    entity,
}: {
    resolveTrees: ResolveTree[];
    entity: Relationship;
}): Record<string, GraphQLTreeLeafField> {
    return Object.fromEntries(
        resolveTrees.map((resolveTree) => {
            const fieldName = resolveTree.name;
            const field = parseAttributeField({ resolveTree, entity });
            if (!field) {
                throw new ResolveTreeParserError(`${fieldName} attribute not found in ${entity.name}`);
            }

            return field;
        })
    );
}

function parseEntityFields({
    resolveTrees,
    entity,
}: {
    resolveTrees: ResolveTree[];
    entity: ConcreteEntity | Relationship;
}): Record<string, GraphQLTreeReadOperation | GraphQLTreeLeafField> {
    return Object.fromEntries(
        resolveTrees.map((resolveTree) => {
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
                fields: undefined,
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
