import { GraphQLDirective, DirectiveLocation, GraphQLString, GraphQLNonNull } from "graphql";

export const cypherDirective = new GraphQLDirective({
    name: "cypher",
    description:
        "Instructs @neo4j/graphql to run the specified Cypher statement in order to resolve the value of the field to which the directive is applied.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        statement: {
            description:
                "The Cypher statement to run which returns a value of the same type composition as the field definition on which the directive is applied.",
            type: new GraphQLNonNull(GraphQLString),
        },
    },
});

export const ignoreDirective = new GraphQLDirective({
    name: "ignore",
    description:
        "Instructs @neo4j/graphql to completely ignore a field definition, assuming that it will be fully accounted for by custom resolvers.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const privateDirective = new GraphQLDirective({
    name: "private",
    description: "Instructs @neo4j/graphql to only expose a field through the Neo4j GraphQL OGM.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const readonlyDirective = new GraphQLDirective({
    name: "readonly",
    description:
        "Instructs @neo4j/graphql to exclude a field from the generated input types for the object type within which the directive is applied.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const writeonlyDirective = new GraphQLDirective({
    name: "writeonly",
    description:
        "Instructs @neo4j/graphql to only include a field in the generated input types for the object type within which the directive is applied, but exclude it from the object type itself.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});
