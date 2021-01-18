import { GraphQLScalarType } from "graphql";
import { int, Integer } from "neo4j-driver";

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

/* 
    https://spec.graphql.org/June2018/#sec-ID 
    The ID type is serialized in the same way as a String
*/
export const ID = new GraphQLScalarType({
    name: "ID",
    parseValue(value: string | number) {
        // value from the client

        if (typeof value === "string") {
            return value;
        }

        return value.toString(10);
    },
    serialize(value: Integer | string | number) {
        // value sent to the client

        if (typeof value === "string") {
            return value;
        }

        return value.toString(10);
    },
});
