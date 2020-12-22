import { GraphQLScalarType, StringValueNode, ValueNode } from "graphql";

function parseLiteral(ast: ValueNode): Date | Date[] {
    if (!["StringValue"].includes(ast.kind)) {
        throw new Error("invalid DateTime");
    }

    if (ast.kind === "ListValue") {
        return ast.values.map(parseLiteral) as Date[];
    }

    return new Date((ast as StringValueNode).value as string);
}

const DateTime = new GraphQLScalarType({
    name: "DateTime",
    description: "A date and time, represented as an ISO-8601 string",
    serialize: (value: string) => {
        // What users get, deserialize turns it into a toISOString
        return value;
    },
    parseValue: (value: string) => {
        return new Date(value);
    },
    parseLiteral,
});

export default DateTime;
