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

import { GraphQLFloat, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";

export const FloatScalarFilters = new GraphQLInputObjectType({
    name: "FloatScalarFilters",
    description: "Float filters",
    fields: {
        eq: {
            type: GraphQLFloat,
        },
        gt: { type: GraphQLFloat },
        gte: { type: GraphQLFloat },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)) },
        lt: { type: GraphQLFloat },
        lte: { type: GraphQLFloat },
    },
});

export const FloatListFilters = new GraphQLInputObjectType({
    name: "FloatListFilters",
    description: "Float list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLFloat)) },
        includes: { type: GraphQLFloat },
    },
});
