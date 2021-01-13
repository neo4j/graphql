/* eslint-disable no-param-reassign */
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
import { beforeAll, afterAll, describe, expect } from "@jest/globals";
import { SchemaDirectiveVisitor, printSchemaWithDirectives } from "@graphql-tools/utils";
import { translate } from "../../src/translate";
import { makeAugmentedSchema } from "../../src";
import serialize from "../../src/utils/serialize";
import { noGraphQLErrors } from "../../../../scripts/tests/utils";
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
                const neoSchema = makeAugmentedSchema({ typeDefs: schema });

                // @ts-ignore
                test.each(tests.map((t) => [t.name, t as Test]))("%s", async (_, obj) => {
                    const test = obj as Test;

                    const graphQlQuery = test.graphQlQuery as string;
                    const graphQlParams = test.graphQlParams as any;
                    const cypherQuery = test.cypherQuery as string;
                    const cypherParams = test.cypherParams as any;
                    const jwt = test.jwt;

                    const compare = (context: any, resolveInfo: any) => {
                        const [cQuery, cQueryParams] = translate({ context, resolveInfo });
                        expect(trimmer(cQuery)).toEqual(trimmer(cypherQuery));
                        expect(serialize(cQueryParams)).toEqual(cypherParams);
                    };

                    const socket = new Socket({ readable: true });
                    const req = new IncomingMessage(socket);
                    const token = jsonwebtoken.sign(jwt, process.env.JWT_SECRET as string);
                    req.headers.authorization = `Bearer ${token}`;

                    const context = {
                        req,
                    };

                    const queries = document.definitions.reduce((res, def) => {
                        if (def.kind !== "ObjectTypeDefinition") {
                            return res;
                        }

                        return {
                            ...res,
                            [pluralize(def.name.value)]: (_root: any, _params: any, ctx: any, resolveInfo: any) => {
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
                                    [pluralize(def.name.value.charAt(0).toLowerCase() + def.name.value.slice(1))]: [],
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
                                    [pluralize(def.name.value.charAt(0).toLowerCase() + def.name.value.slice(1))]: [],
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

                    noGraphQLErrors(await graphql(executableSchema, graphQlQuery, null, context, graphQlParams));
                });
            }

            if (kind === "schema") {
                // @ts-ignore
                test.each(tests.map((t) => [t.name, t as Test]))("%s", (_, obj) => {
                    const test = obj as Test;

                    const typeDefs = test.typeDefs as string;
                    const neoSchema = makeAugmentedSchema({ typeDefs });

                    const schemaOutPut = test.schemaOutPut as string;
                    const resolvers = neoSchema.resolvers;
                    const outPutSchema = makeExecutableSchema({ typeDefs: schemaOutPut, resolvers });

                    expect(printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema))).toEqual(
                        printSchemaWithDirectives(lexicographicSortSchema(outPutSchema))
                    );
                });
            }
        });
    });
});
