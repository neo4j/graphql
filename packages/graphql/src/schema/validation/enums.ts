import { GraphQLEnumType } from "graphql";

export const ExcludeOperationEnum = new GraphQLEnumType({
    name: "ExcludeOperation",
    values: {
        CREATE: {
            value: "CREATE",
        },
        READ: {
            value: "READ",
        },
        UPDATE: {
            value: "UPDATE",
        },
        DELETE: {
            value: "DELETE",
        },
    },
});

export const RelationshipDirectionEnum = new GraphQLEnumType({
    name: "RelationshipDirection",
    values: {
        IN: {
            value: "IN",
        },
        OUT: {
            value: "OUT",
        },
    },
});
