import { GraphQLBoolean, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const PageInfo = new GraphQLObjectType({
    name: "PageInfo",
    description: "Pagination information (Relay)",
    fields: {
        hasNextPage: {
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        hasPreviousPage: {
            type: new GraphQLNonNull(GraphQLBoolean),
        },
        startCursor: {
            type: GraphQLString,
        },
        endCursor: {
            type: GraphQLString,
        },
    },
});
