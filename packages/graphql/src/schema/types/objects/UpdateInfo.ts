import { GraphQLInt, GraphQLNonNull, GraphQLObjectType, GraphQLString } from "graphql";

export const UpdateInfo = new GraphQLObjectType({
    name: "UpdateInfo",
    fields: {
        bookmark: {
            type: GraphQLString,
        },
        nodesCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        nodesDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsCreated: {
            type: new GraphQLNonNull(GraphQLInt),
        },
        relationshipsDeleted: {
            type: new GraphQLNonNull(GraphQLInt),
        },
    },
});
