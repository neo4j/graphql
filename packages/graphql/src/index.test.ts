import { graphql } from "graphql";
import { makeExecutableSchema } from "graphql-tools";
import gql from "graphql-tag";
import { cypherQuery, Context } from "./index";
import { noGraphQLErrors } from "../../../scripts/tests/utils";

const movieSchema = gql`
    type Movie {
        id: ID
        title: String
    }

    type Query {
        Movie(title: String): Movie
    }
`;

// Replace all \n with a space & replace all spaces > 1 with a single space
const trimmer = (str: string) => str.replace(/\n/g, " ").replace(/\s\s+/g, " ");

describe("cypherQuery", () => {
    test("should return the correct cypher with a single selection", async () => {
        const graphqlQuery = `{
            Movie {
                title
              }
        }`;

        const expectedCQuery = `
            MATCH (\`movie\`:\`Movie\`) 
            RETURN \`movie\` { .title } AS \`movie\`
        `;

        const expectedCParams = {};

        const resolver = (_object: any, params: any, ctx: Context, resolveInfo: any) => {
            const [cQuery, cQueryParams] = cypherQuery(params, ctx, resolveInfo);

            expect(trimmer(cQuery)).toEqual(trimmer(expectedCQuery));
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

    test("should return the correct cypher with a multiple selections", async () => {
        const graphqlQuery = `{
            Movie {
                id
                title
              }
        }`;

        const expectedCQuery = `
            MATCH (\`movie\`:\`Movie\`) 
            RETURN \`movie\` { .id, .title } AS \`movie\`
        `;

        const expectedCParams = {};

        const resolver = (_object: any, params: any, ctx: Context, resolveInfo: any) => {
            const [cQuery, cQueryParams] = cypherQuery(params, ctx, resolveInfo);

            expect(trimmer(cQuery)).toEqual(trimmer(expectedCQuery));
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
