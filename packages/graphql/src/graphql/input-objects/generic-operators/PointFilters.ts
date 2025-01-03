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
import { PointInput } from "../PointInput";

const DistancePointFilters = new GraphQLInputObjectType({
    name: "PointDistanceFilters",
    description: "Distance filters",
    fields: {
        from: {
            type: new GraphQLNonNull(PointInput),
        },
        gt: { type: GraphQLFloat },
        gte: { type: GraphQLFloat },
        lt: { type: GraphQLFloat },
        lte: { type: GraphQLFloat },
        eq: { type: GraphQLFloat },
    },
});

export const PointFilters = new GraphQLInputObjectType({
    name: "PointFilters",
    description: "Point filters",
    fields: {
        eq: {
            type: PointInput,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(PointInput)) },
        distance: { type: DistancePointFilters },
    },
});

export const PointListFilters = new GraphQLInputObjectType({
    name: "PointListFilters",
    description: "Point list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(PointInput)) },
        includes: { type: PointInput },
    },
});
