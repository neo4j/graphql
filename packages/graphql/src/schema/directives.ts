import { GraphQLDirective, DirectiveLocation, GraphQLString, GraphQLNonNull, GraphQLScalarType, Kind } from "graphql";

export const ScalarType = new GraphQLScalarType({
    name: "Scalar",
    description: "Int | Float | String | Boolean | ID",
    serialize(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID");
        }

        return value;
    },
    parseValue(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID");
        }

        return value;
    },
    parseLiteral(ast) {
        switch (ast.kind) {
            case Kind.INT:
                return parseInt(ast.value, 10);
            case Kind.FLOAT:
                return parseFloat(ast.value);
            case Kind.STRING:
                return ast.value;
            case Kind.BOOLEAN:
                return ast.value;
            default:
                throw new Error("Value must be one of types: Int | Float | String | Boolean | ID");
        }
    },
});

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

export const defaultDirective = new GraphQLDirective({
    name: "default",
    description:
        "Instructs @neo4j/graphql to set the specified value as the default value in the CreateInput type for the object type in which this directive is used.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description: "The default value to use. Must be a scalar type.",
            type: new GraphQLNonNull(ScalarType),
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
