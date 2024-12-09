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

import { GraphQLID, GraphQLInputObjectType, GraphQLList, GraphQLNonNull } from "graphql";

export const IDScalarFilters = new GraphQLInputObjectType({
    name: "IDScalarFilters",
    description: "ID filters",
    fields: {
        eq: {
            type: GraphQLID,
        },
        matches: { type: GraphQLID },
        gt: { type: GraphQLID }, // GT/LT/GTE etc should not be added all the time
        gte: { type: GraphQLID },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLID)) },
        lt: { type: GraphQLID },
        lte: { type: GraphQLID },
        contains: { type: GraphQLID },
        endsWith: { type: GraphQLID },
        startsWith: { type: GraphQLID },
    },
});

export const IDListFilters = new GraphQLInputObjectType({
    name: "IDListFilters",
    description: "ID list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(IDScalarFilters)) },
        includes: { type: IDScalarFilters },
    },
});
