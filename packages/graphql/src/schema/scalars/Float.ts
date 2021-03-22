import { GraphQLScalarType } from "graphql";
import { Integer, isInt } from "neo4j-driver";

export default new GraphQLScalarType({
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
