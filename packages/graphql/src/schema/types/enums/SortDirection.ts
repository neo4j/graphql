import { GraphQLEnumType } from "graphql";

export const SortDirection = new GraphQLEnumType({
    name: "SortDirection",
    values: {
        ASC: {
            value: "ASC",
            description: "Sort by field values in ascending order.",
        },
        DESC: {
            value: "DESC",
            description: "Sort by field values in descending order.",
        },
    },
});
