import { printSchema, GraphQLSchema } from "graphql";
import { lexicographicSortSchema } from "graphql/utilities";

function diffSchema(firstSchema: GraphQLSchema, secondSchema: GraphQLSchema): boolean {
    // eslint-disable-next-line no-param-reassign
    [firstSchema, secondSchema] = [lexicographicSortSchema(firstSchema), lexicographicSortSchema(secondSchema)];

    return printSchema(firstSchema) === printSchema(secondSchema);
}

export default diffSchema;
