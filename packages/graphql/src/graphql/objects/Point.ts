/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
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
            resolve: numericalResolver,
        },
    },
});
