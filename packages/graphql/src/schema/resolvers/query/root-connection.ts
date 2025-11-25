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
import { UnionEntityAdapter } from "../../../schema-model/entity/model-adapters/UnionEntityAdapter";
import type { Neo4jGraphQLSchemaModel } from "../../../schema-model/Neo4jGraphQLSchemaModel";
import { translateRead } from "../../../translate/translate-read";
import { execute } from "../../../utils";
import getNeo4jResolveTree from "../../../utils/get-neo4j-resolve-tree";
import { isNeoInt } from "../../../utils/utils";
import { makeSortInput } from "../../generation/sort-and-options-input";
import { createConnectionWithEdgeProperties } from "../../pagination";
import { graphqlDirectivesToCompose } from "../../to-compose";
import type { Neo4jGraphQLComposedContext } from "../composition/wrap-query-and-mutation";
import { emptyConnection } from "./empty-connection";

export function rootConnectionResolver({
    composer,
    entityAdapter,
    propagatedDirectives,
    isLimitRequired,
    schemaModel,
}: {
    composer: SchemaComposer;
    entityAdapter: InterfaceEntityAdapter | ConcreteEntityAdapter;
    propagatedDirectives: DirectiveNode[];
    isLimitRequired: boolean | undefined;
    schemaModel: Neo4jGraphQLSchemaModel;
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
            source: { edges: record.edges, aggregate: record.aggregate },
            args: { first: args.first, after: args.after },
            totalCount,
        });

        return {
            totalCount,
            edges: connection.edges,
            pageInfo: connection.pageInfo,
            aggregate: connection.aggregate,
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
        directives: graphqlDirectivesToCompose(propagatedDirectives),
    });

    if (entityAdapter.isReadable(schemaModel)) {
        rootConnection.addFields({
            edges: rootEdge.NonNull.List.NonNull,
            totalCount: new GraphQLNonNull(GraphQLInt),
            pageInfo: new GraphQLNonNull(PageInfo),
        });
    }

    if (entityAdapter.isAggregable(schemaModel)) {
        rootConnection.addFields({
            aggregate: `${entityAdapter.operations.aggregateTypeNames.connection}!`,
        });
    }

    // since sort is not created when there is nothing to sort, we check for its existence
    let sortArg: InputTypeComposer | undefined;
    if (!(entityAdapter instanceof UnionEntityAdapter)) {
        sortArg = makeSortInput({ entityAdapter, userDefinedFieldDirectives: new Map(), composer });
    }

    return {
        type: rootConnection.NonNull,
        resolve,
        args: {
            first: isLimitRequired ? new GraphQLNonNull(GraphQLInt) : GraphQLInt,
            after: GraphQLString,
            where: entityAdapter.operations.whereInputTypeName,
            ...(sortArg ? { sort: sortArg.NonNull.List } : {}),
        },
    };
}
