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
import { TopLevelResolveTreeParser } from "./TopLevelResolveTreeParser";
import { findFieldByName } from "./find-field-by-name";
import type { GraphQLTreeReadOperation, GraphQLTreeReadOperationTopLevel } from "./graphql-tree";

export class GlobalNodeResolveTreeParser extends TopLevelResolveTreeParser {
    constructor({ entity }: { entity: ConcreteEntity }) {
        super({ entity: entity });
    }

    /** Parse a resolveTree into a Neo4j GraphQLTree */
    public parseOperationTopLevel(resolveTree: ResolveTree): GraphQLTreeReadOperationTopLevel {
        // FIXME
        const connectionResolveTree = findFieldByName(
            resolveTree,
            this.entity.typeNames.connectionOperation,
            "connection"
        );

        const connection = connectionResolveTree ? this.parseConnection(connectionResolveTree) : undefined;
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

    /** Parse a resolveTree into a Neo4j GraphQLTree */
    public parseOperation(resolveTree: ResolveTree): GraphQLTreeReadOperation {
        const entityTypes = this.targetNode.typeNames;
        resolveTree.fieldsByTypeName[entityTypes.node] = {
            ...resolveTree.fieldsByTypeName["Node"],
            ...resolveTree.fieldsByTypeName[entityTypes.node],
        };
        const node = resolveTree ? this.parseNode(resolveTree) : undefined;

        return {
            alias: resolveTree.alias,
            args: {
                where: {
                    edges: {
                        node: {
                            id: { equals: resolveTree.args.id as any },
                        },
                    },
                },
            },
            name: resolveTree.name,
            fields: {
                connection: {
                    alias: "connection",
                    args: {},
                    fields: {
                        edges: {
                            alias: "edges",
                            args: {},
                            fields: {
                                node,
                            },
                        },
                    },
                },
            },
        };
    }
}
