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

import { GraphQLInputObjectType, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";
import { Float as FloatScalar, Int } from "./scalars";

export const point = new GraphQLObjectType({
    name: "Point",
    fields: {
        longitude: {
            type: new GraphQLNonNull(FloatScalar),
            resolve: (source) => {
                return source.point.x;
            },
        },
        latitude: {
            type: new GraphQLNonNull(FloatScalar),
            resolve: (source) => {
                return source.point.y;
            },
        },
        height: {
            type: FloatScalar,
            resolve: (source) => {
                return source.point.z;
            },
        },
        crs: {
            type: new GraphQLNonNull(GraphQLString),
        },
        srid: {
            type: new GraphQLNonNull(Int),
            resolve: (source) => {
                return source.point.srid;
            },
        },
    },
});

export const pointInput = new GraphQLInputObjectType({
    name: "PointInput",
    fields: {
        longitude: {
            type: new GraphQLNonNull(FloatScalar),
        },
        latitude: {
            type: new GraphQLNonNull(FloatScalar),
        },
        height: {
            type: FloatScalar,
        },
    },
});

export const pointDistance = new GraphQLInputObjectType({
    name: "PointDistance",
    fields: {
        point: {
            type: new GraphQLNonNull(pointInput),
        },
        distance: {
            type: new GraphQLNonNull(FloatScalar),
            description: "The distance in metres to be used when comparing two points",
        },
    },
});

export const cartesianPoint = new GraphQLObjectType({
    name: "CartesianPoint",
    fields: {
        x: {
            type: new GraphQLNonNull(FloatScalar),
            resolve: (source) => {
                return source.point.x;
            },
        },
        y: {
            type: new GraphQLNonNull(FloatScalar),
            resolve: (source) => {
                return source.point.y;
            },
        },
        z: {
            type: FloatScalar,
            resolve: (source) => {
                return source.point.z;
            },
        },
        crs: {
            type: new GraphQLNonNull(GraphQLString),
        },
        srid: {
            type: new GraphQLNonNull(Int),
            resolve: (source) => {
                return source.point.srid;
            },
        },
    },
});

export const cartesianPointInput = new GraphQLInputObjectType({
    name: "CartesianPointInput",
    fields: {
        x: {
            type: new GraphQLNonNull(FloatScalar),
        },
        y: {
            type: new GraphQLNonNull(FloatScalar),
        },
        z: {
            type: FloatScalar,
        },
    },
});

export const cartesianPointDistance = new GraphQLInputObjectType({
    name: "CartesianPointDistance",
    fields: {
        point: {
            type: new GraphQLNonNull(cartesianPointInput),
        },
        distance: {
            type: new GraphQLNonNull(FloatScalar),
        },
    },
});
