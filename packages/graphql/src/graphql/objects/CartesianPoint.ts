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

export const CartesianPoint = new GraphQLObjectType({
    name: "CartesianPoint",
    description:
        "A point in a two- or three-dimensional Cartesian coordinate system or in a three-dimensional cylindrical coordinate system. For more information, see https://neo4j.com/docs/graphql/4/type-definitions/types/spatial/#cartesian-point",
    fields: {
        x: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        y: {
            type: new GraphQLNonNull(GraphQLFloat),
        },
        z: {
            type: GraphQLFloat,
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
