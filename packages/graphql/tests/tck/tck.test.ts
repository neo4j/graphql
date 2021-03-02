/* eslint-disable no-param-reassign */
import camelCase from "camelcase";
import {
    graphql,
    printSchema,
    parse,
    GraphQLScalarType,
    ScalarTypeExtensionNode,
    DirectiveDefinitionNode,
} from "graphql";
import { lexicographicSortSchema } from "graphql/utilities";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";
import pluralize from "pluralize";
import jsonwebtoken from "jsonwebtoken";
import { IncomingMessage } from "http";
import { Socket } from "net";
import { SchemaDirectiveVisitor, printSchemaWithDirectives } from "@graphql-tools/utils";
import { translate } from "../../src/translate";
import { Neo4jGraphQL } from "../../src";
import { generateTestCasesFromMd, Test, TestCase } from "./utils/generate-test-cases-from-md.utils";
import { trimmer } from "../../src/utils";

const TCK_DIR = path.join(__dirname, "tck-test-files");

beforeAll(() => {
    process.env.JWT_SECRET = "secret";
});

afterAll(() => {
    delete process.env.JWT_SECRET;
});

function generateCustomScalar(name: string): GraphQLScalarType {
    return new GraphQLScalarType({
        name,
        serialize: (value) => value,
        parseValue: (value) => value,
    });
}

class CustomDirective extends SchemaDirectiveVisitor {
    // eslint-disable-next-line class-methods-use-this
    visitFieldDefinition(field) {
        const { defaultFieldResolver } = field;
        return defaultFieldResolver();
    }
}

describe("TCK Generated tests", () => {
    const testCases: TestCase[] = generateTestCasesFromMd(TCK_DIR);

    testCases.forEach(({ schema, tests, file, kind }) => {
        describe(file, () => {
            if (kind === "cypher") {
                const document = parse(schema as string);
                const neoSchema = new Neo4jGraphQL({ typeDefs: schema as string });

                // @ts-ignore
                test.each(tests.map((t) => [t.name, t]))("%s", async (_, obj) => {
                    const test = obj as Test;

                    const graphQlQuery = test.graphQlQuery as string;
                    const graphQlParams = test.graphQlParams as any;
                    const cypherQuery = test.cypherQuery as string;
                    const cypherParams = test.cypherParams as any;
                    const { jwt } = test;

                    const compare = (context: any, resolveInfo: any) => {
                        const [cQuery, cQueryParams] = translate({ context, resolveInfo });
                        expect(trimmer(cQuery)).toEqual(trimmer(cypherQuery));
                        expect(cQueryParams).toEqual(cypherParams);
                    };

                    let context = {};

                    if (!cypherParams.jwt) {
                        const socket = new Socket({ readable: true });
                        const req = new IncomingMessage(socket);
                        const token = jsonwebtoken.sign(jwt, process.env.JWT_SECRET as string, { noTimestamp: true });
                        req.headers.authorization = `Bearer ${token}`;

                        context = {
                            req,
                        };
                    }

                    const queries = document.definitions.reduce((res, def) => {
                        if (def.kind !== "ObjectTypeDefinition") {
                            return res;
                        }

                        return {
                            ...res,
                            [pluralize(camelCase(def.name.value))]: (
                                _root: any,
                                _params: any,
                                ctx: any,
                                resolveInfo: any
                            ) => {
                                ctx.neoSchema = neoSchema;

                                compare(context, resolveInfo);

                                return [];
                            },
                        };
                    }, {});

                    const mutations = document.definitions.reduce((res, def) => {
                        if (def.kind !== "ObjectTypeDefinition") {
                            return res;
                        }

                        return {
                            ...res,
                            [`create${pluralize(def.name.value)}`]: (
                                _root: any,
                                _params: any,
                                ctx: any,
                                resolveInfo: any
                            ) => {
                                ctx.neoSchema = neoSchema;

                                compare(context, resolveInfo);

                                return {
                                    [pluralize(camelCase(def.name.value))]: [],
                                };
                            },
                            [`update${pluralize(def.name.value)}`]: (
                                _root: any,
                                _params: any,
                                ctx: any,
                                resolveInfo: any
                            ) => {
                                ctx.neoSchema = neoSchema;

                                compare(context, resolveInfo);

                                return {
                                    [pluralize(camelCase(def.name.value))]: [],
                                };
                            },
                            [`delete${pluralize(def.name.value)}`]: (
                                _root: any,
                                _params: any,
                                ctx: any,
                                resolveInfo: any
                            ) => {
                                ctx.neoSchema = neoSchema;

                                compare(context, resolveInfo);

                                return { nodesDeleted: 1, relationshipsDeleted: 1 };
                            },
                        };
                    }, {});

                    const resolvers = { Query: queries, Mutation: mutations };

                    const customScalars = document.definitions.reduce((r, def) => {
                        if (def.kind !== "ScalarTypeDefinition") {
                            return r;
                        }

                        const { name } = (def as unknown) as ScalarTypeExtensionNode;

                        return { ...r, [name.value]: generateCustomScalar(name.value) };
                    }, {});

                    const directives = document.definitions.reduce((r, def) => {
                        if (def.kind !== "DirectiveDefinition") {
                            return r;
                        }

                        const { name } = (def as unknown) as DirectiveDefinitionNode;

                        // @ts-ignore
                        return { ...r, [name.value]: new CustomDirective() };
                    }, {});

                    const executableSchema = makeExecutableSchema({
                        typeDefs: printSchema(neoSchema.schema),
                        resolvers,
                        ...customScalars,
                        schemaDirectives: directives,
                    });

                    const result = await graphql(executableSchema, graphQlQuery, null, context, graphQlParams);

                    if (result.errors) {
                        console.log(result.errors);
                    }

                    // @ts-ignore
                    expect(result.errors).toBeFalsy();
                });
            }

            if (kind === "schema") {
                // @ts-ignore
                test.each(tests.map((t) => [t.name, t]))("%s", (_, obj) => {
                    const test = obj as Test;

                    const typeDefs = test.typeDefs as string;
                    const neoSchema = new Neo4jGraphQL({ typeDefs });

                    const schemaOutPut = test.schemaOutPut as string;
                    const { resolvers } = neoSchema;
                    const outPutSchema = makeExecutableSchema({ typeDefs: schemaOutPut, resolvers });

                    expect(printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema))).toEqual(
                        printSchemaWithDirectives(lexicographicSortSchema(outPutSchema))
                    );
                });
            }
        });
    });
});
