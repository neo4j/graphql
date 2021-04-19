export { GraphQLOptionsArg, GraphQLWhereArg, DeleteInfo, GraphQLSortArg } from "@neo4j/graphql";

export type DriverConfig = {
    database?: string;
    bookmarks?: string | string[];
};
