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
import type { FulltextContext, Neo4jFeaturesSettings } from "../../types";
import {
    withFulltextResultTypeConnection,
    withFulltextSortInputType,
    withFulltextWhereInputType,
} from "../generation/fulltext-input";
import { fulltextResolver } from "../resolvers/query/fulltext";

export function augmentFulltextSchema({
    composer,
    concreteEntityAdapter,
    features,
}: {
    composer: SchemaComposer;
    concreteEntityAdapter: ConcreteEntityAdapter;
    features?: Neo4jFeaturesSettings;
}) {
    if (!concreteEntityAdapter.annotations.fulltext) {
        return;
    }

    withFulltextWhereInputType({ composer, concreteEntityAdapter });

    concreteEntityAdapter.annotations.fulltext.indexes.forEach((index) => {
        const fulltextContext: FulltextContext = {
            index,
            queryType: "query",
            queryName: index.queryName,
            scoreVariable: new Cypher.Variable(),
        };

        const fulltextArgs = {
            phrase: new GraphQLNonNull(GraphQLString),
            where: concreteEntityAdapter.operations.fulltextTypeNames.where,
            sort: withFulltextSortInputType({ concreteEntityAdapter, composer }).NonNull.List,
            first: features?.limitRequired ? new GraphQLNonNull(GraphQLInt) : GraphQLInt,
            after: GraphQLString,
        };

        composer.Query.addFields({
            [index.queryName]: {
                type: withFulltextResultTypeConnection({ composer, concreteEntityAdapter }).NonNull,
                resolve: fulltextResolver({ fulltextContext, entityAdapter: concreteEntityAdapter }),
                args: fulltextArgs,
            },
        });
    });
}
