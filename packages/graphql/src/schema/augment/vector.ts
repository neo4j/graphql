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

import { GraphQLFloat, GraphQLInt, GraphQLList, GraphQLNonNull, GraphQLString } from "graphql";
import type { SchemaComposer } from "graphql-compose";

import Cypher from "@neo4j/cypher-builder";
import type { ConcreteEntityAdapter } from "../../schema-model/entity/model-adapters/ConcreteEntityAdapter";
import type { Neo4jFeaturesSettings, VectorContext } from "../../types";
import {
    withVectorResultTypeConnection,
    withVectorSortInputType,
    withVectorWhereInputType,
} from "../generation/vector-input";
import { vectorResolver } from "../resolvers/query/vector";

export function augmentVectorSchema({
    composer,
    concreteEntityAdapter,
    features,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    features?: Neo4jFeaturesSettings;
}) {
    if (!concreteEntityAdapter.annotations.vector) {
        return;
    }

    withVectorWhereInputType({ composer, concreteEntityAdapter });

    concreteEntityAdapter.annotations.vector.indexes.forEach((index) => {
        const vectorContext: VectorContext = {
            index,
            queryType: "query",
            queryName: index.queryName,
            scoreVariable: new Cypher.Variable(),
            vectorSettings: features?.vector || {},
        };

        const vectorArgs = {
            where: concreteEntityAdapter.operations.vectorTypeNames.where,
            sort: withVectorSortInputType({ concreteEntityAdapter, composer }).NonNull.List,
            first: GraphQLInt,
            after: GraphQLString,
        };

        if (index.provider !== undefined || index.callback !== undefined) {
            vectorArgs["phrase"] = new GraphQLNonNull(GraphQLString);
        } else {
            vectorArgs["vector"] = new GraphQLList(new GraphQLNonNull(GraphQLFloat));
        }

        composer.Query.addFields({
            [index.queryName]: {
                type: withVectorResultTypeConnection({ composer, concreteEntityAdapter }).NonNull,
                resolve: vectorResolver({ vectorContext, entityAdapter: concreteEntityAdapter }),
                args: vectorArgs,
            },
        });
    });
}
