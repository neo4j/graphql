import { graphql } from "graphql";
import gql from "graphql-tag";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";
import { cypherQuery as generateCypherQuery } from "../../src/api/index";
import { noGraphQLErrors } from "../../../../scripts/tests/utils";
import { generateTestCasesFromMd, Test, TestCase } from "./utils/generate-test-cases-from-md.utils";

const TCK_DIR = path.join(__dirname, "tck-test-files");

// Replace all \n with a space & replace all spaces > 1 with a single space
const trimmer = (str: string) => str.replace(/\n/g, " ").replace(/\s\s+/g, " ").trim();

describe("TCK Generated tests", () => {
    const testCases: TestCase[] = generateTestCasesFromMd(TCK_DIR);

    testCases.forEach(({ schema, tests, file }) => {
        describe(file, () => {
            test.each(tests.map((t) => [t.name, t as Test]))("%s", async (_name, obj) => {
                // @ts-ignore
                const { graphQlQuery, graphQlParams, cypherQuery, cypherParams } = obj;
                const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
                    const [cQuery, cQueryParams] = generateCypherQuery(params, ctx, resolveInfo);

                    expect(trimmer(cQuery)).toEqual(trimmer(cypherQuery));
                    expect(cQueryParams).toEqual(cypherParams);
                };
                const resolvers = {
                    Query: {
                        Movie: resolver,
                    },
                };

                const augmentedSchema = makeExecutableSchema({
                    typeDefs: gql`
                        ${schema}
                    `,
                    resolvers,
                });

                noGraphQLErrors(await graphql(augmentedSchema, graphQlQuery, null, null, graphQlParams));
            });
        });
    });
});
