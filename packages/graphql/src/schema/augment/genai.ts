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

import { GraphQLInt, GraphQLNonNull, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { GenAIContext } from "../../types";
import {
    withGenAIInputType,
    withGenAIResultType,
    withGenAISortInputType,
    withGenAIWhereInputType,
} from "../generation/genai-input";
import { genAIResolver } from "../resolvers/query/genai";

export function augmentGenAISchema({
    composer,
    concreteEntityAdapter,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
}) {
    if (!concreteEntityAdapter.annotations.genAI) {
        return;
    }

    withGenAIInputType({ concreteEntityAdapter, composer });
    withGenAIWhereInputType({ composer, concreteEntityAdapter });

    concreteEntityAdapter.annotations.genAI.indexes.forEach((index) => {
        const queryName = concreteEntityAdapter.operations.getGenAIIndexQueryFieldName(index.indexName);
        const genAIContext: GenAIContext = {
            name: index.indexName,
            queryType: "query",
            queryName,
            fields: [],
            scoreVariable: new Cypher.Variable(),
        };

        composer.Query.addFields({
            [queryName]: {
                type: withGenAIResultType({ composer, concreteEntityAdapter }).NonNull.List.NonNull,
                description:
                    "Query a vector index using GenAI. This query returns the query score, but does not allow for aggregations.",
                resolve: genAIResolver({ genAIContext, entityAdapter: concreteEntityAdapter }),
                args: {
                    phrase: new GraphQLNonNull(GraphQLString),
                    where: concreteEntityAdapter.operations.genAITypeNames.where,
                    sort: withGenAISortInputType({ concreteEntityAdapter, composer }).NonNull.List,
                    limit: GraphQLInt,
                    offset: GraphQLInt,
                },
            },
        });
    });
}
