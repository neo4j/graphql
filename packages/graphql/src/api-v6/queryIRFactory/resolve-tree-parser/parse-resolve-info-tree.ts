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
import {
    parseConnectionArgs,
    parseConnectionArgsTopLevel,
    parseOperationArgs,
    parseOperationArgsTopLevel,
} from "../argument-parser/parse-args";
import { parseCreateOperationArgsTopLevel } from "../argument-parser/parse-create-args";
import type {
    GraphQLTree,
    GraphQLTreeConnection,
    GraphQLTreeConnectionTopLevel,
    GraphQLTreeCreate,
    GraphQLTreeReadOperation,
} from "./graphql-tree/graphql-tree";
import { parseEdges } from "./parse-edges";
import { findFieldByName } from "./utils/find-field-by-name";

export function parseResolveInfoTree({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity;
}): GraphQLTree {
    const connectionResolveTree = findFieldByName(resolveTree, entity.typeNames.connectionOperation, "connection");
    const connection = connectionResolveTree ? parseTopLevelConnection(connectionResolveTree, entity) : undefined;
    const connectionOperationArgs = parseOperationArgsTopLevel(resolveTree.args);

    return {
        alias: resolveTree.alias,
        args: connectionOperationArgs,
        name: resolveTree.name,
        fields: {
            connection,
        },
    };
}

export function parseResolveInfoTreeCreate({
    resolveTree,
    entity,
}: {
    resolveTree: ResolveTree;
    entity: ConcreteEntity;
}): GraphQLTreeCreate {
    const createResponse = findFieldByName(resolveTree, entity.typeNames.createResponse, entity.typeNames.queryField);
    const createArgs = parseCreateOperationArgsTopLevel(resolveTree.args);
    console.log("createResponse", createResponse);
    console.log("createInput", createArgs);
    return {
        alias: resolveTree.alias,
        name: resolveTree.name,
        fields: {
            // TODO: add tree for selection
        },
        args: createArgs,
    };
}

export function parseConnection(resolveTree: ResolveTree, entity: Relationship): GraphQLTreeConnection {
    const entityTypes = entity.typeNames;
    const edgesResolveTree = findFieldByName(resolveTree, entityTypes.connection, "edges");
    const edgeResolveTree = edgesResolveTree ? parseEdges(edgesResolveTree, entity) : undefined;
    const connectionArgs = parseConnectionArgs(resolveTree.args, entity.target as ConcreteEntity, entity);
    return {
        alias: resolveTree.alias,
        args: connectionArgs,
        fields: {
            edges: edgeResolveTree,
        },
    };
}

export function parseRelationshipField(
    resolveTree: ResolveTree,
    entity: ConcreteEntity
): GraphQLTreeReadOperation | undefined {
    const relationship = entity.findRelationship(resolveTree.name);
    if (!relationship) {
        return;
    }
    const connectionResolveTree = findFieldByName(
        resolveTree,
        relationship.typeNames.connectionOperation,
        "connection"
    );
    const connection = connectionResolveTree ? parseConnection(connectionResolveTree, relationship) : undefined;
    const connectionOperationArgs = parseOperationArgs(resolveTree.args);
    return {
        alias: resolveTree.alias,
        args: connectionOperationArgs,
        name: resolveTree.name,
        fields: {
            connection,
        },
    };
}

function parseTopLevelConnection(resolveTree: ResolveTree, entity: ConcreteEntity): GraphQLTreeConnectionTopLevel {
    const entityTypes = entity.typeNames;
    const edgesResolveTree = findFieldByName(resolveTree, entityTypes.connection, "edges");
    const edgeResolveTree = edgesResolveTree ? parseEdges(edgesResolveTree, entity) : undefined;
    const connectionArgs = parseConnectionArgsTopLevel(resolveTree.args, entity);

    return {
        alias: resolveTree.alias,
        args: connectionArgs,
        fields: {
            edges: edgeResolveTree,
        },
    };
}
