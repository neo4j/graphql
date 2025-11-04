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

import {
    GraphQLInt,
    GraphQLNonNull,
    GraphQLString,
    type DirectiveNode,
    type GraphQLResolveInfo,
    type SelectionSetNode,
} from "graphql";
import type { InputTypeComposer, SchemaComposer } from "graphql-compose";
import { PageInfo } from "../../../graphql/objects/PageInfo";
import type { ConcreteEntityAdapter } from "../../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { InterfaceEntityAdapter } from "../../../schema-model/entity/model-adapters/InterfaceEntityAdapter";
import { translateRead } from "../../../translate";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../../utils/utils";
import { createConnectionWithEdgeProperties } from "../../pagination";
import { graphqlDirectivesToCompose } from "../../to-compose";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";
import { emptyConnection } from "./empty-connection";

export function rootConnectionResolver({
    composer,
    entityAdapter,
    propagatedDirectives,
}: {
    composer: SchemaComposer;
    entityAdapter: InterfaceEntityAdapter | ConcreteEntityAdapter;
    propagatedDirectives: DirectiveNode[];
}) {
    async function resolve(_root: any, args: any, context: Neo4jGraphQLComposedContext, info: GraphQLResolveInfo) {
        const resolveTree = getNeo4jResolveTree(info, { args });

        const { cypher, params } = translateRead({
            context: { ...context, resolveTree },
            entityAdapter: entityAdapter,
            varName: "this",
        });

        const executeResult = await execute({
            cypher,
            params,
            defaultAccessMode: "READ",
            context,
        });

        if (!executeResult.records[0]) {
            return emptyConnection;
        }

        const record = executeResult.records[0].this;
        const totalCount = isNeoInt(record.totalCount) ? record.totalCount.toNumber() : record.totalCount;

        const connection = createConnectionWithEdgeProperties({
            selectionSet: resolveTree as unknown as SelectionSetNode,
            source: { edges: record.edges },
            args: { first: args.first, after: args.after },
            totalCount,
        });

        return {
            totalCount,
            edges: connection.edges,
            pageInfo: connection.pageInfo,
        };
    }

    const rootEdge = composer.createObjectTC({
        name: `${entityAdapter.name}Edge`,
        fields: {
            cursor: new GraphQLNonNull(GraphQLString),
            node: `${entityAdapter.name}!`,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    const rootConnection = composer.createObjectTC({
        name: `${entityAdapter.upperFirstPlural}Connection`,
        fields: {
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
            edges: rootEdge.NonNull.List.NonNull,
        },
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    // since sort is not created when there is nothing to sort, we check for its existence
    let sortArg: InputTypeComposer | undefined;
    if (composer.has(entityAdapter.operations.sortInputTypeName)) {
        sortArg = composer.getITC(entityAdapter.operations.sortInputTypeName);
    }

    return {
        type: rootConnection.NonNull,
        resolve,
        args: {
            first: GraphQLInt,
            after: GraphQLString,
            where: entityAdapter.operations.whereInputTypeName,
            ...(sortArg ? { sort: sortArg.List } : {}),
            ...(entityAdapter.annotations.fulltext
                ? {
                      fulltext: {
                          type: entityAdapter.operations.fullTextInputTypeName,
                          description:
                              "Query a full-text index. Allows for the aggregation of results, but does not return the query score. Use the root full-text query fields if you require the score.",
                      },
                  }
                : {}),
        },
    };
}
