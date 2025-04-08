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

import { GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";
import { GraphQLDate } from "../../scalars";

export const DateScalarFilters = new GraphQLInputObjectType({
    name: "DateScalarFilters",
    description: "Date filters",
    fields: {
        eq: {
            type: GraphQLDate,
        },
        gt: { type: GraphQLDate },
        gte: { type: GraphQLDate },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLDate)) },
        lt: { type: GraphQLDate },
        lte: { type: GraphQLDate },
    },
});

export const DateListFilters = new GraphQLInputObjectType({
    name: "DateListFilters",
    description: "Date list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLDate)) },
        includes: { type: GraphQLDate },
    },
});
