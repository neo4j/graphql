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

import { GraphQLResolveInfo } from "graphql";
import { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { execute } from "../../utils";
import { translateRead } from "../../translate";
import { Node } from "../../classes";
import { Context } from "../../types";
import getNeo4jResolveTree from "../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../utils/utils";
import { createConnectionWithEdgeProperties } from "../pagination";

export default function rootConnectionResolver({ node, composer }: { node: Node; composer: SchemaComposer }) {
    async function resolve(_root: any, _args: any, _context: unknown, info: GraphQLResolveInfo) {
        const context = _context as Context;
        const resolveTree = getNeo4jResolveTree(info);

        const edgeTree = resolveTree.fieldsByTypeName[`${node.name}RootConnection`].edges;
        const nodeTree = edgeTree.fieldsByTypeName[`${node.name}RootEdge`].node;

        context.resolveTree = { ...nodeTree, args: resolveTree.args };
        context.isRootConnectionField = true;

        const [cypher, params] = translateRead({ context, node });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
        });

        const { totalCount, edges } = executeResult.records[0].this;
        console.log(JSON.stringify(edges, null, 2));
        const connection = createConnectionWithEdgeProperties({
            selectionSet: resolveTree,
            source: { edges },
            args: resolveTree.args,
            totalCount,
        });

        return {
            totalCount: isNeoInt(totalCount) ? totalCount.toNumber() : totalCount,
            ...connection,
        };
    }

    const rootEdge = composer.createObjectTC({
        name: `${node.name}RootEdge`,
        fields: {
            cursor: "String!",
            node: `${node.name}!`,
        },
    });

    const rootConnection = composer.createObjectTC({
        name: `${node.name}RootConnection`,
        fields: {
            totalCount: "Int!",
            pageInfo: "PageInfo!",
            edges: rootEdge.NonNull.List.NonNull,
        },
    });

    // since sort is not created when there is nothing to sort, we check for its existence
    let sortArg: InputTypeComposer<any> | undefined;
    try {
        sortArg = composer.getITC(`${node.name}Sort`);
        /* eslint-disable-next-line no-empty */
    } catch (e) {}

    return {
        type: rootConnection.NonNull,
        resolve,
        args: {
            first: "Int",
            last: "Int",
            after: "String",
            before: "String",
            where: `${node.name}Where`,
            ...(sortArg ? { sort: sortArg.List } : {}),
            ...(node.fulltextDirective ? { fulltext: `${node.name}Fulltext` } : {}),
        },
    };
}
