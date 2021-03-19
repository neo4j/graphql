import {
    GraphQLDirective,
    DirectiveLocation,
    GraphQLString,
    GraphQLNonNull,
    GraphQLScalarType,
    Kind,
    GraphQLEnumType,
} from "graphql";

export const ScalarType = new GraphQLScalarType({
    name: "Scalar",
    description: "Int | Float | String | Boolean | ID | DateTime",
    serialize(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime");
        }

        return value;
    },
    parseValue(value) {
        if (!["string", "number", "boolean"].includes(typeof value)) {
            throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime");
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
                throw new Error("Value must be one of types: Int | Float | String | Boolean | ID | DateTime");
        }
    },
});

export const RelationshipDirectionEnum = new GraphQLEnumType({
    name: "RelationshipDirection",
    values: {
        IN: {
            value: "IN",
        },
        OUT: {
            value: "OUT",
        },
    },
});

export const coalesceDirective = new GraphQLDirective({
    name: "coalesce",
    description:
        "Instructs @neo4j/graphql to wrap the property in a coalesce() function during queries, using the single value specified.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        value: {
            description:
                "The value to use in the coalesce() function. Must be a scalar type and must match the type of the field with which this directive decorates.",
            type: new GraphQLNonNull(ScalarType),
        },
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
            description:
                "The default value to use. Must be a scalar type and must match the type of the field with which this directive decorates.",
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
        "Instructs @neo4j/graphql to only include a field in generated input type for creating, and in the object type within which the directive is applied.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});

export const relationshipDirective = new GraphQLDirective({
    name: "relationship",
    description:
        "Instructs @neo4j/graphql to treat this field as a relationship. Opens up the ability to create and connect on this field.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
    args: {
        type: {
            type: new GraphQLNonNull(GraphQLString),
        },
        direction: {
            type: new GraphQLNonNull(RelationshipDirectionEnum),
        },
    },
});

export const writeonlyDirective = new GraphQLDirective({
    name: "writeonly",
    description:
        "Instructs @neo4j/graphql to only include a field in the generated input types for the object type within which the directive is applied, but exclude it from the object type itself.",
    locations: [DirectiveLocation.FIELD_DEFINITION],
});
