import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const DeleteInfo = new GraphQLObjectType({
    name: "DeleteInfo",
    fields: {
        bookmark: {
            type: GraphQLString,
        },
        nodesDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
    },
});
