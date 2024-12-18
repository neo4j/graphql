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
import { CartesianPointInput } from "../CartesianPointInput";

const CartesianDistancePointFilters = new GraphQLInputObjectType({
    name: "CartesianDistancePointFilters",
    description: "Distance filters for cartesian points",
    fields: {
        from: {
            type: new GraphQLNonNull(CartesianPointInput),
        },
        gt: { type: GraphQLFloat },
        gte: { type: GraphQLFloat },
        lt: { type: GraphQLFloat },
        lte: { type: GraphQLFloat },
    },
});

export const CartesianPointFilters = new GraphQLInputObjectType({
    name: "CartesianPointFilters",
    description: "Cartesian Point filters",
    fields: {
        eq: {
            type: CartesianPointInput,
        },
        in: { type: new GraphQLList(new GraphQLNonNull(CartesianPointInput)) },
        distance: { type: CartesianDistancePointFilters },
    },
});

export const CartesianPointListFilters = new GraphQLInputObjectType({
    name: "CartesianPointListFilters",
    description: "CartesianPoint list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(CartesianPointInput)) },
        includes: { type: CartesianPointInput },
    },
});
