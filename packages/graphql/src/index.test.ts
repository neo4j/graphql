import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import gql from "graphql-tag";
import { cypherQuery, Context } from "./index";
import { noGraphQLErrors } from "../../../scripts/tests/utils";

const movieSchema = gql`
    type Movie {
        title: String
    }
    type Query {
        Movie(title: String): Movie
    }
`;

describe("cypherQuery", () => {
    test("simple query", async () => {
        const graphqlQuery = `{
            Movie {
                title
              }
        }`;

        const expectedCQuery = "MATCH (`movie`:`Movie`) RETURN `movie` { .title } AS `movie`";
        const expectedCParams = {};

        const resolver = (_object: any, params: any, ctx: Context, resolveInfo: any) => {
            const [cQuery, cQueryParams] = cypherQuery(params, ctx, resolveInfo);
            expect(cQuery).toEqual(expectedCQuery);
            expect(cQueryParams).toEqual(expectedCParams);
        };
        const resolvers = {
            Query: {
                Movie: resolver,
            },
        };

        const augmentedSchema = makeExecutableSchema({
            typeDefs: movieSchema,
            resolvers,
        });

        noGraphQLErrors(await graphql(augmentedSchema, graphqlQuery, null, null, {}));
    });
});
