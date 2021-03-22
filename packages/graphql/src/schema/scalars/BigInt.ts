import { GraphQLScalarType, Kind, ValueNode } from "graphql";
import { int, Integer } from "neo4j-driver";

export default new GraphQLScalarType({
    name: "BigInt",
    description:
        "A BigInt value up to 64 bits in size, which can be a number or a string if used inline, or a string only if used as a variable. Always returned as a string.",
    serialize(value: Integer) {
        return value.toString(10);
    },
    parseValue(value: string) {
        if (typeof value !== "string") {
            throw new Error(
                "BigInt values are not JSON serializable. Please pass as a string in variables, or inline in the GraphQL query."
            );
        }

        return int(value);
    },
    parseLiteral(ast: ValueNode) {
        switch (ast.kind) {
            case Kind.INT:
            case Kind.STRING:
                return int(ast.value);
            default:
                throw new Error("Value must be either a BigInt, or a string representing a BigInt value.");
        }
    },
});
