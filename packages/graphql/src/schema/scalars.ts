import { GraphQLScalarType, StringValueNode, ValueNode } from "graphql";
import { int, Integer } from "neo4j-driver";
import { DateTime as Neo4jDateTime } from "neo4j-driver/lib/temporal-types";

export const Float = new GraphQLScalarType({
    name: "Float",
    parseValue(value) {
        // value from the client

        if (typeof value !== "number") {
            throw new Error("Cannot represent non number as Float");
        }

        return value;
    },
    serialize(value) {
        // value sent to the client
        return value;
    },
});

export const Int = new GraphQLScalarType({
    name: "Int",
    parseValue(value) {
        // value from the client

        if (typeof value !== "number") {
            throw new Error("Cannot represent non number as Int");
        }

        return int(value);
    },
    serialize(value: Integer) {
        // value sent to the client

        if (value.toNumber) {
            return value.toNumber();
        }

        return value;
    },
});

export const DateTime = new GraphQLScalarType({
    name: "DateTime",
    description: "A date and time, represented as an ISO-8601 string",
    serialize: (value: Neo4jDateTime) => {
        // value sent to the client

        return new Date(value.toString()).toISOString();
    },
    parseValue: (value: string) => {
        // value from the client

        return Neo4jDateTime.fromStandardDate(new Date(value));
    },
});
