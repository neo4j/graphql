import { GraphQLDirective, GraphQLObjectType, GraphQLScalarType, GraphQLSchema, GraphQLString } from "graphql";
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
        directives: [...Object.values(directives as { [s: string]: GraphQLDirective })],
        types: [
            ...Object.values(scalars as { [s: string]: GraphQLScalarType }),
            ...Object.values(objects as Record<string, GraphQLObjectType>),
        ],
    });
};
