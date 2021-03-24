import { GraphQLScalarType } from "graphql";
import { Integer } from "neo4j-driver";

/*
    https://spec.graphql.org/June2018/#sec-ID
    The ID type is serialized in the same way as a String
*/
export default new GraphQLScalarType({
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
