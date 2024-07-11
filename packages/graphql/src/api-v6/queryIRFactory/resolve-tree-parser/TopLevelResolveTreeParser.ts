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
import { ResolveTreeParser } from "./ResolveTreeParser";
import { findFieldByName } from "./find-field-by-name";
import type {
    GraphQLConnectionArgsTopLevel,
    GraphQLReadOperationArgsTopLevel,
    GraphQLSortEdgeArgument,
    GraphQLTreeConnectionTopLevel,
    GraphQLTreeEdge,
    GraphQLTreeReadOperationTopLevel,
} from "./graphql-tree";

export class TopLevelResolveTreeParser extends ResolveTreeParser<ConcreteEntity> {
    protected get targetNode(): ConcreteEntity {
        return this.entity;
    }

    /** Parse a resolveTree into a Neo4j GraphQLTree */
    public parseOperationTopLevel(resolveTree: ResolveTree): GraphQLTreeReadOperationTopLevel {
        const connectionResolveTree = findFieldByName(
            resolveTree,
            this.entity.typeNames.connectionOperation,
            "connection"
        );

        const connection = connectionResolveTree ? this.parseTopLevelConnection(connectionResolveTree) : undefined;
        const connectionOperationArgs = this.parseOperationArgsTopLevel(resolveTree.args);
        return {
            alias: resolveTree.alias,
            args: connectionOperationArgs,
            name: resolveTree.name,
            fields: {
                connection,
            },
        };
    }

    private parseTopLevelConnection(resolveTree: ResolveTree): GraphQLTreeConnectionTopLevel {
        const entityTypes = this.entity.typeNames;
        const edgesResolveTree = findFieldByName(resolveTree, entityTypes.connection, "edges");
        const edgeResolveTree = edgesResolveTree ? this.parseEdges(edgesResolveTree) : undefined;
        const connectionArgs = this.parseConnectionArgsTopLevel(resolveTree.args);

        return {
            alias: resolveTree.alias,
            args: connectionArgs,
            fields: {
                edges: edgeResolveTree,
            },
        };
    }

    private parseConnectionArgsTopLevel(resolveTreeArgs: { [str: string]: any }): GraphQLConnectionArgsTopLevel {
        let sortArg: GraphQLSortEdgeArgument[] | undefined;
        if (resolveTreeArgs.sort) {
            sortArg = resolveTreeArgs.sort.map((sortArg) => {
                return this.parseSortEdges(sortArg);
            });
        }

        return {
            sort: sortArg,
            first: resolveTreeArgs.first,
            after: resolveTreeArgs.after,
        };
    }

    protected parseOperationArgsTopLevel(resolveTreeArgs: Record<string, any>): GraphQLReadOperationArgsTopLevel {
        // Not properly parsed, assuming the type is the same
        return {
            where: resolveTreeArgs.where,
        };
    }

    protected parseEdges(resolveTree: ResolveTree): GraphQLTreeEdge {
        const edgeType = this.entity.typeNames.edge;

        const nodeResolveTree = findFieldByName(resolveTree, edgeType, "node");

        const node = nodeResolveTree ? this.parseNode(nodeResolveTree) : undefined;

        return {
            alias: resolveTree.alias,
            args: resolveTree.args,
            fields: {
                node: node,
                properties: undefined,
            },
        };
    }
}
