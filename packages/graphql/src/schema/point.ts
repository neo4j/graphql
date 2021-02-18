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
