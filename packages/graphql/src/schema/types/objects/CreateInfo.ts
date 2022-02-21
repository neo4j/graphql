import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const CreateInfo = new GraphQLObjectType({
    name: "CreateInfo",
    fields: {
        bookmark: {
            type: GraphQLString,
        },
        nodesCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
    },
});
