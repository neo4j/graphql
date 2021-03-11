import { GraphQLScalarType } from "graphql";
import { int, Integer, isInt } from "neo4j-driver";
import { DateTime as Neo4jDateTime } from "neo4j-driver/lib/temporal-types";

export const Float = new GraphQLScalarType({
    name: "Float",
    parseValue(value) {
        if (typeof value !== "number") {
            throw new Error("Cannot represent non number as Float");
        }

        return value;
    },
    serialize(value: number | Integer) {
        if (typeof value === "number") {
            return value;
        }

        if (isInt(value)) {
            return value.toNumber();
        }

        return value;
    },
});

export const Int = new GraphQLScalarType({
    name: "Int",
    parseValue(value) {
        if (typeof value !== "number") {
            throw new Error("Cannot represent non number as Int");
        }

        return int(value);
    },
    serialize(value: Integer) {
        if (value.toNumber) {
            return value.toNumber();
        }

        return value;
    },
});

/*
    https://spec.graphql.org/June2018/#sec-ID
    The ID type is serialized in the same way as a String
*/
export const ID = new GraphQLScalarType({
    name: "ID",
    parseValue(value: string | number) {
        if (typeof value === "string") {
            return value;
        }

        return value.toString(10);
    },
    serialize(value: Integer | string | number) {
        if (typeof value === "string") {
            return value;
        }

        return value.toString(10);
    },
});

export const DateTime = new GraphQLScalarType({
    name: "DateTime",
    description: "A date and time, represented as an ISO-8601 string",
    serialize: (value: Neo4jDateTime) => {
        return new Date(value.toString()).toISOString();
    },
    parseValue: (value: string) => {
        return Neo4jDateTime.fromStandardDate(new Date(value));
    },
});

export const BigInt = new GraphQLScalarType({
    name: "BigInt",
});
