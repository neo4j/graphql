/* eslint-disable no-param-reassign */
import { graphql, printSchema, parse } from "graphql";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";
import { translate } from "../../src/translate";
import { makeAugmentedSchema } from "../../src";
import { serialize } from "../../src/neo4j";
import { noGraphQLErrors } from "../../../../scripts/tests/utils";
import { generateTestCasesFromMd, Test, TestCase } from "./utils/generate-test-cases-from-md.utils";
import { trimmer } from "../../src/utils";
import diffSchema from "./utils/diff-schema.utils";

const TCK_DIR = path.join(__dirname, "tck-test-files");

describe("TCK Generated tests", () => {
    const testCases: TestCase[] = generateTestCasesFromMd(TCK_DIR);

    testCases.forEach(({ schema, tests, file, kind }) => {
        describe(file, () => {
            if (kind === "cypher") {
                const document = parse(schema as string);
                const neoSchema = makeAugmentedSchema({ typeDefs: schema });

                test.each(tests.map((t) => [t.name, t as Test]))("%s", async (_, obj) => {
                    const test = obj as Test;

                    const graphQlQuery = test.graphQlQuery as string;
                    const graphQlParams = test.graphQlParams as any;
                    const cypherQuery = test.cypherQuery as string;
                    const cypherParams = test.cypherParams as any;

                    const resolver = (_object: any, params: any, ctx: any, resolveInfo: any) => {
                        if (!ctx) {
                            ctx = {};
                        }
                        ctx.neoSchema = neoSchema;

                        const [cQuery, cQueryParams] = translate(params, ctx, resolveInfo);
                        expect(trimmer(cQuery)).toEqual(trimmer(cypherQuery));
                        expect(serialize(cQueryParams)).toEqual(cypherParams);

                        return [];
                    };

                    const queries = document.definitions.reduce((res, def) => {
                        if (def.kind !== "ObjectTypeDefinition") {
                            return res;
                        }

                        return {
                            ...res,
                            [`FindOne_${def.name.value}`]: resolver,
                            [`FindMany_${def.name.value}`]: resolver,
                        };
                    }, {});

                    const resolvers = { Query: queries };

                    const executableSchema = makeExecutableSchema({
                        typeDefs: printSchema(neoSchema.schema),
                        resolvers,
                    });

                    noGraphQLErrors(await graphql(executableSchema, graphQlQuery, null, null, graphQlParams));
                });
            }

            if (kind === "schema") {
                test.each(tests.map((t) => [t.name, t as Test]))("%s", (_, obj) => {
                    const test = obj as Test;

                    const typeDefs = test.typeDefs as string;
                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const schemaOutPut = test.schemaOutPut as string;
                    const resolvers = neoSchema.resolvers;
                    const outPutSchema = makeExecutableSchema({ typeDefs: schemaOutPut, resolvers });

                    expect(diffSchema(neoSchema.schema, outPutSchema)).toEqual(true);
                });
            }
        });
    });
});
