import { graphql } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import gql from "graphql-tag";
import { describe, test, expect } from "@jest/globals";
import cypherQuery from "../../../src/api/cypher-query";
import { noGraphQLErrors } from "../../../../../scripts/tests/utils";

const movieSchema = gql`
    type Movie {
        id: ID
        title: String
    }

    type Query {
        Movie(title: String, skip: Int, limit: Int): Movie
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
            MATCH (\`Movie\`:\`Movie\`) 
            RETURN \`Movie\` { .title } AS \`Movie\`
        `;

        const expectedCParams = {};

        const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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
            MATCH (\`Movie\`:\`Movie\`) 
            RETURN \`Movie\` { .id, .title } AS \`Movie\`
        `;

        const expectedCParams = {};

        const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

    test("should return the correct cypher and parameters with a single concatenated argument", async () => {
        const graphqlQuery = `{
            Movie(title: "some title") {
                id
                title
              }
        }`;

        const expectedCQuery = `
            MATCH (\`Movie\`:\`Movie\` { \`title\`:$title }) 
            RETURN \`Movie\` { .id, .title } AS \`Movie\`
        `;

        const expectedCParams = {
            title: "some title",
        };

        const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

    test("should return the correct cypher and parameters with a single variable argument", async () => {
        const graphqlQuery = `
            query($title: String){
                Movie(title: $title) {
                    id
                    title
                }
            }
        `;

        const expectedCQuery = `
            MATCH (\`Movie\`:\`Movie\` { \`title\`:$title }) 
            RETURN \`Movie\` { .id, .title } AS \`Movie\`
        `;

        const expectedCParams = {
            title: "some title",
        };

        const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

        noGraphQLErrors(await graphql(augmentedSchema, graphqlQuery, null, null, { title: "some title" }));
    });

    describe("Pagination", () => {
        test("should return the correct cypher with skip", async () => {
            const graphqlQuery = `{
                Movie(skip: 1) {
                    id
                    title
                  }
            }`;

            const expectedCQuery = `
                MATCH (\`Movie\`:\`Movie\`) 
                RETURN \`Movie\` { .id, .title } AS \`Movie\`
                SKIP $skip
            `;

            const expectedCParams = {
                skip: 1,
            };

            const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

        test("should return the correct cypher with limit", async () => {
            const graphqlQuery = `{
                Movie(limit: 1) {
                    id
                    title
                  }
            }`;

            const expectedCQuery = `
                MATCH (\`Movie\`:\`Movie\`) 
                RETURN \`Movie\` { .id, .title } AS \`Movie\`
                LIMIT $limit
            `;

            const expectedCParams = {
                limit: 1,
            };

            const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

        test("should return the correct cypher with skip and limit concatenated", async () => {
            const graphqlQuery = `{
                Movie(skip: 1, limit: 1) {
                    id
                    title
                  }
            }`;

            const expectedCQuery = `
                MATCH (\`Movie\`:\`Movie\`) 
                RETURN \`Movie\` { .id, .title } AS \`Movie\`
                SKIP $skip
                LIMIT $limit
            `;

            const expectedCParams = {
                skip: 1,
                limit: 1,
            };

            const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

        test("should return the correct cypher with skip and limit as variables", async () => {
            const graphqlQuery = `
            query($skip: Int, $limit: Int){
                Movie(skip: $skip, limit: $limit) {
                    id
                    title
                  }
            }`;

            const expectedCQuery = `
                MATCH (\`Movie\`:\`Movie\`) 
                RETURN \`Movie\` { .id, .title } AS \`Movie\`
                SKIP $skip
                LIMIT $limit
            `;

            const expectedCParams = {
                skip: 1,
                limit: 1,
            };

            const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

            noGraphQLErrors(await graphql(augmentedSchema, graphqlQuery, null, null, { skip: 1, limit: 1 }));
        });

        test("should return the correct cypher with skip and limit and other params", async () => {
            const graphqlQuery = `
            query($title: String, $skip: Int, $limit: Int){
                Movie(title: $title, skip: $skip, limit: $limit) {
                    id
                    title
                  }
            }`;

            const expectedCQuery = `
                MATCH (\`Movie\`:\`Movie\` { \`title\`:$title }) 
                RETURN \`Movie\` { .id, .title } AS \`Movie\`
                SKIP $skip
                LIMIT $limit
            `;

            const expectedCParams = {
                skip: 1,
                limit: 1,
                title: "some title",
            };

            const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
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

            noGraphQLErrors(
                await graphql(augmentedSchema, graphqlQuery, null, null, { skip: 1, limit: 1, title: "some title" })
            );
        });
    });
});
