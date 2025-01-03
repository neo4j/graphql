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
import { GraphQLLocalDateTime } from "../../scalars";

export const LocalDateTimeScalarFilters = new GraphQLInputObjectType({
    name: "LocalDateTimeScalarFilters",
    description: "LocalDateTime filters",
    fields: {
        eq: {
            type: GraphQLLocalDateTime,
        },
        gt: { type: GraphQLLocalDateTime },
        gte: { type: GraphQLLocalDateTime },
        in: { type: new GraphQLList(new GraphQLNonNull(GraphQLLocalDateTime)) },
        lt: { type: GraphQLLocalDateTime },
        lte: { type: GraphQLLocalDateTime },
    },
});

export const LocalDateTimeListFilters = new GraphQLInputObjectType({
    name: "LocalDateTimeListFilters",
    description: "LocalDateTime list filters",
    fields: {
        eq: { type: new GraphQLList(new GraphQLNonNull(GraphQLLocalDateTime)) },
        includes: { type: GraphQLLocalDateTime },
    },
});
