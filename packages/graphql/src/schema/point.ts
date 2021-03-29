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

import { InputTypeComposerAsObjectDefinition, ObjectTypeComposerAsObjectDefinition } from "graphql-compose";

export const point: ObjectTypeComposerAsObjectDefinition<unknown, unknown> = {
    name: "Point",
    fields: {
        longitude: {
            type: "Float!",
            resolve: (source) => {
                return source.point.x;
            },
        },
        latitude: {
            type: "Float!",
            resolve: (source) => {
                return source.point.y;
            },
        },
        height: {
            type: "Float",
            resolve: (source) => {
                return source.point.z;
            },
        },
        crs: "String!",
        srid: {
            type: "Int!",
            resolve: (source) => {
                return source.point.srid;
            },
        },
    },
};

export const pointInput: InputTypeComposerAsObjectDefinition = {
    name: "PointInput",
    fields: {
        longitude: "Float!",
        latitude: "Float!",
        height: "Float",
    },
};

export const pointDistance: InputTypeComposerAsObjectDefinition = {
    name: "PointDistance",
    fields: {
        point: "PointInput!",
        distance: {
            type: "Float!",
            description: "The distance in metres to be used when comparing two points",
        },
    },
};

export const cartesianPoint: ObjectTypeComposerAsObjectDefinition<unknown, unknown> = {
    name: "CartesianPoint",
    fields: {
        x: {
            type: "Float!",
            resolve: (source) => {
                return source.point.x;
            },
        },
        y: {
            type: "Float!",
            resolve: (source) => {
                return source.point.y;
            },
        },
        z: {
            type: "Float",
            resolve: (source) => {
                return source.point.z;
            },
        },
        crs: "String!",
        srid: {
            type: "Int!",
            resolve: (source) => {
                return source.point.srid;
            },
        },
    },
};

export const cartesianPointInput: InputTypeComposerAsObjectDefinition = {
    name: "CartesianPointInput",
    fields: {
        x: "Float!",
        y: "Float!",
        z: "Float",
    },
};

export const cartesianPointDistance: InputTypeComposerAsObjectDefinition = {
    name: "CartesianPointDistance",
    fields: {
        point: "CartesianPointInput!",
        distance: "Float!",
    },
};
