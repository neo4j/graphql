import { GraphQLObjectType, GraphQLSchema, GraphQLString } from "graphql";
import { directives, scalars, objects } from "@neo4j/graphql";

export const getSchemaForLintAndAutocompletion = () => {
    return new GraphQLSchema({
        query: new GraphQLObjectType({
            name: "Query",
            fields: {
                _ignore: {
                    type: GraphQLString,
                    resolve: () => {
                        return "Hello from GraphQL";
                    },
                },
            },
        }),
        directives: [...Object.values(directives)],
        types: [...Object.values(scalars), ...Object.values(objects)],
    });
};
