import { GraphQLInputObjectType, GraphQLInt } from "graphql";

export const QueryOptions = new GraphQLInputObjectType({
    name: "QueryOptions",
    fields: {
        offset: {
            type: GraphQLInt,
        },
        limit: {
            type: GraphQLInt,
        },
    },
});
