import { GraphQLScalarType } from "graphql";
import { DateTime as Neo4jDateTime } from "neo4j-driver/lib/temporal-types";

export default new GraphQLScalarType({
    name: "DateTime",
    description: "A date and time, represented as an ISO-8601 string",
    serialize: (value: Neo4jDateTime) => {
        return new Date(value.toString()).toISOString();
    },
    parseValue: (value: string) => {
        return Neo4jDateTime.fromStandardDate(new Date(value));
    },
});
