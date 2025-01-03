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
import { GraphQLTime } from "../../scalars";

export const TimeScalarFilters = new GraphQLInputObjectType({
    name: "TimeScalarFilters",
    description: "Time filters",
    fields: {
        eq: {
            type: GraphQLTime,
        },
        gt: { type: GraphQLTime },
        gte: { type: GraphQLTime },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLTime)) },
        lt: { type: GraphQLTime },
        lte: { type: GraphQLTime },
    },
});

export const TimeListFilters = new GraphQLInputObjectType({
    name: "TimeListFilters",
    description: "Time list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLTime)) },
        includes: { type: GraphQLTime },
    },
});
