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

import type { ConcreteEntity } from "../../../schema-model/entity/ConcreteEntity";
import type { Relationship } from "../../../schema-model/relationship/Relationship";
import type {
    GraphQLTreeConnection,
    GraphQLTreeConnectionTopLevel,
    GraphQLTreeReadOperation,
    GraphQLTreeReadOperationTopLevel,
} from "../resolve-tree-parser/graphql-tree/graphql-tree";
import type { GraphQLSort, GraphQLSortEdge, GraphQLTreeSortElement } from "../resolve-tree-parser/graphql-tree/sort";
import { ResolveTreeParserError } from "../resolve-tree-parser/resolve-tree-parser-error";

export function parseOperationArgs(resolveTreeArgs: Record<string, any>): GraphQLTreeReadOperation["args"] {
    // Not properly parsed, assuming the type is the same
    return {
        where: resolveTreeArgs.where,
    };
}

export function parseOperationArgsTopLevel(
    resolveTreeArgs: Record<string, any>
): GraphQLTreeReadOperationTopLevel["args"] {
    // Not properly parsed, assuming the type is the same
    return {
        where: resolveTreeArgs.where,
    };
}

export function parseConnectionArgs(
    resolveTreeArgs: { [str: string]: any },
    entity: ConcreteEntity,
    relationship: Relationship
): GraphQLTreeConnection["args"] {
    let sortArg: GraphQLSort[] | undefined;
    if (resolveTreeArgs.sort) {
        sortArg = resolveTreeArgs.sort.map((sortArg): GraphQLSort => {
            return { edges: parseSortEdges(sortArg.edges, entity, relationship) };
        });
    }
    return {
        sort: sortArg,
        first: resolveTreeArgs.first,
        after: resolveTreeArgs.after,
    };
}

export function parseConnectionArgsTopLevel(
    resolveTreeArgs: Record<string, any>,
    entity: ConcreteEntity
): GraphQLTreeConnectionTopLevel["args"] {
    let sortArg: GraphQLSortEdge[] | undefined;
    if (resolveTreeArgs.sort) {
        sortArg = resolveTreeArgs.sort.map((sortArg) => {
            return parseSortEdges(sortArg, entity);
        });
    }

    return {
        sort: sortArg,
        first: resolveTreeArgs.first,
        after: resolveTreeArgs.after,
    };
}

function parseSortEdges(
    sortEdges: {
        node: Record<string, string> | undefined;
        properties: Record<string, string> | undefined;
    },
    targetNode: ConcreteEntity,
    targetRelationship?: Relationship
): GraphQLSortEdge {
    const sortFields: GraphQLSortEdge = {};
    const nodeFields = sortEdges.node;

    if (nodeFields) {
        const fields = parseSortFields(targetNode, nodeFields);
        sortFields.node = fields;
    }
    const edgeProperties = sortEdges.properties;

    if (edgeProperties && targetRelationship) {
        const fields = parseSortFields(targetRelationship, edgeProperties);
        sortFields.properties = fields;
    }
    return sortFields;
}

function parseSortFields(
    target: Relationship | ConcreteEntity,
    sortObject: Record<string, string>
): GraphQLTreeSortElement {
    return Object.fromEntries(
        Object.entries(sortObject).map(([fieldName, resolveTreeDirection]) => {
            if (target.hasAttribute(fieldName)) {
                const direction = parseDirection(resolveTreeDirection);
                return [fieldName, direction];
            }
            throw new ResolveTreeParserError(`Invalid sort field: ${fieldName}`);
        })
    );
}

function parseDirection(direction: string): "ASC" | "DESC" {
    if (direction === "ASC" || direction === "DESC") {
        return direction;
    }
    throw new ResolveTreeParserError(`Invalid sort direction: ${direction}`);
}
