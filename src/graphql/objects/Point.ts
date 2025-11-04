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

import { GraphQLFloat, GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { numericalResolver } from "../../schema/resolvers/field/numerical";
import { sridToCrs } from "./utils/srid-to-crs";

export const Point = new GraphQLObjectType({
    name: "Point",
    description:
        "A point in a coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#point",
    fields: {
        longitude: {
            type: new GraphQLNonNull(GraphQLFloat),
            resolve: (source) => source.longitude || source.x,
        },
        latitude: {
            type: new GraphQLNonNull(GraphQLFloat),
            resolve: (source) => source.latitude || source.y,
        },
        height: {
            type: GraphQLFloat,
            resolve: (source) => source.height || source.z,
        },
        crs: {
            type: new GraphQLNonNull(GraphQLString),
            resolve: (source) => sridToCrs(source.srid),
        },
        srid: {
            type: new GraphQLNonNull(GraphQLInt),
            resolve: (source, args, context, info) => numericalResolver(source, args, context, info),
        },
    },
});
