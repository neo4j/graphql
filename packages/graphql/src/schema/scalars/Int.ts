import { GraphQLScalarType } from "graphql";
import { int, Integer } from "neo4j-driver";

export default new GraphQLScalarType({
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
