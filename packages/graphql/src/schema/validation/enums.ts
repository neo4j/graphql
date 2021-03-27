import { GraphQLEnumType } from "graphql";

export const ExcludeOperationEnum = new GraphQLEnumType({
    name: "ExcludeOperation",
    values: {
        CREATE: {},
        READ: {},
        UPDATE: {},
        DELETE: {},
    },
});

export const RelationshipDirectionEnum = new GraphQLEnumType({
    name: "RelationshipDirection",
    values: {
        IN: {},
        OUT: {},
    },
});

export const TimestampOperationEnum = new GraphQLEnumType({
    name: "TimestampOperation",
    values: {
        CREATE: {},
        UPDATE: {},
    },
});
