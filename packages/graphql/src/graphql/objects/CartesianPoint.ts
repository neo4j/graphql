/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            resolve: numericalResolver,
        },
    },
});
