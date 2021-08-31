/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import camelCase from "camelcase";
import {
    graphql,
    printSchema,
    parse,
    GraphQLScalarType,
    ScalarTypeExtensionNode,
    DirectiveDefinitionNode,
    GraphQLResolveInfo,
} from "graphql";
import { lexicographicSortSchema } from "graphql/utilities";
import { makeExecutableSchema } from "@graphql-tools/schema";
import path from "path";
import pluralize from "pluralize";
import jsonwebtoken from "jsonwebtoken";
import { IncomingMessage } from "http";
import { Socket } from "net";
// import { parseResolveInfo, ResolveTree } from "graphql-parse-resolve-info";
import { SchemaDirectiveVisitor, printSchemaWithDirectives } from "@graphql-tools/utils";
import {
    translateAggregate,
    translateCount,
    translateCreate,
    translateDelete,
    translateRead,
    translateUpdate,
} from "../../src/translate";
import { Context } from "../../src/types";
import { Neo4jGraphQL } from "../../src";
import {
    generateTestCasesFromMd,
    setTestEnvVars,
    Test,
    TestCase,
    unsetTestEnvVars,
} from "./utils/generate-test-cases-from-md.utils";
import { trimmer } from "../../src/utils";
import * as Scalars from "../../src/schema/scalars";
import { Node } from "../../src/classes";
import createAuthParam from "../../src/translate/create-auth-param";
import getNeo4jResolveTree from "../../src/utils/get-neo4j-resolve-tree";

const TCK_DIR = path.join(__dirname, "tck-test-files");

const secret = "secret";

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

    testCases.forEach(({ schema, tests, file, kind, envVars }) => {
        describe(`${file}`, () => {
            setTestEnvVars(envVars);
            if (kind === "cypher") {
                const document = parse(schema as string);
                // @ts-ignore
                const neoSchema = new Neo4jGraphQL({
                    typeDefs: schema as string,
                    // @ts-ignore
                    driver: {},
                    config: { enableRegex: true, jwt: { secret } },
                });

                // @ts-ignore
                test.each(tests.map((t) => [t.name, t]))("%s", async (_, obj) => {
                    const test = obj as Test;
                    const graphQlQuery = test.graphQlQuery as string;
                    const graphQlParams = test.graphQlParams as any;
                    const cypherQuery = test.cypherQuery as string;
                    const cypherParams = test.cypherParams as any;
                    const { jwt } = test;
                    let defaultContext = {};

                    if (!cypherParams.jwt) {
                        const socket = new Socket({ readable: true });
                        const req = new IncomingMessage(socket);
                        const token = jsonwebtoken.sign(jwt, secret, {
                            noTimestamp: true,
                        });
                        req.headers.authorization = `Bearer ${token}`;

                        defaultContext = {
                            req,
                        };
                    }

                    function compare(
                        cypher: { expected: string; received: string },
                        params: { expected: any; received: any },
                        context: any
                    ) {
                        if (
                            cypher.received.includes("$auth.") ||
                            cypher.received.includes("auth: $auth") ||
                            cypher.received.includes("auth:$auth")
                        ) {
                            params.expected.auth = createAuthParam({ context });
                        }

                        expect(trimmer(cypher.expected)).toEqual(trimmer(cypher.received));
                        expect(params.expected).toEqual(params.received);
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
                                context: Context,
                                info: GraphQLResolveInfo
                            ) => {
                                const resolveTree = getNeo4jResolveTree(info);

                                context.neoSchema = neoSchema;
                                context.resolveTree = resolveTree;

                                const mergedContext = { ...context, ...defaultContext };

                                const [cQuery, cQueryParams] = translateRead({
                                    context: mergedContext,
                                    node: neoSchema.nodes.find((x) => x.name === def.name.value) as Node,
                                });

                                compare(
                                    { expected: cQuery, received: cypherQuery },
                                    { expected: cQueryParams, received: cypherParams },
                                    mergedContext
                                );

                                return [];
                            },
                            [`${pluralize(camelCase(def.name.value))}Count`]: (
                                _root: any,
                                _params: any,
                                context: Context,
                                info: GraphQLResolveInfo
                            ) => {
                                const resolveTree = getNeo4jResolveTree(info);

                                context.neoSchema = neoSchema;
                                context.resolveTree = resolveTree;

                                const mergedContext = { ...context, ...defaultContext };

                                const [cQuery, cQueryParams] = translateCount({
                                    context: mergedContext,
                                    node: neoSchema.nodes.find((x) => x.name === def.name.value) as Node,
                                });

                                compare(
                                    { expected: cQuery, received: cypherQuery },
                                    { expected: cQueryParams, received: cypherParams },
                                    mergedContext
                                );

                                return 1;
                            },
                            [`${pluralize(camelCase(def.name.value))}Aggregate`]: (
                                _root: any,
                                _params: any,
                                context: Context,
                                info: GraphQLResolveInfo
                            ) => {
                                const resolveTree = getNeo4jResolveTree(info);

                                context.neoSchema = neoSchema;
                                context.resolveTree = resolveTree;

                                const mergedContext = { ...context, ...defaultContext };

                                const [cQuery, cQueryParams] = translateAggregate({
                                    context: mergedContext,
                                    node: neoSchema.nodes.find((x) => x.name === def.name.value) as Node,
                                });

                                compare(
                                    { expected: cQuery, received: cypherQuery },
                                    { expected: cQueryParams, received: cypherParams },
                                    mergedContext
                                );

                                return {
                                    count: 1,
                                };
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
                                context: any,
                                info: GraphQLResolveInfo
                            ) => {
                                const resolveTree = getNeo4jResolveTree(info);

                                context.neoSchema = neoSchema;
                                context.resolveTree = resolveTree;

                                const mergedContext = { ...context, ...defaultContext };

                                const [cQuery, cQueryParams] = translateCreate({
                                    context: mergedContext,
                                    node: neoSchema.nodes.find((x) => x.name === def.name.value) as Node,
                                });

                                compare(
                                    { expected: cQuery, received: cypherQuery },
                                    { expected: cQueryParams, received: cypherParams },
                                    mergedContext
                                );

                                return {
                                    [pluralize(camelCase(def.name.value))]: [],
                                };
                            },
                            [`update${pluralize(def.name.value)}`]: (
                                _root: any,
                                _params: any,
                                context: any,
                                info: GraphQLResolveInfo
                            ) => {
                                const resolveTree = getNeo4jResolveTree(info);

                                context.neoSchema = neoSchema;
                                context.resolveTree = resolveTree;

                                const mergedContext = { ...context, ...defaultContext };

                                const [cQuery, cQueryParams] = translateUpdate({
                                    context: mergedContext,
                                    node: neoSchema.nodes.find((x) => x.name === def.name.value) as Node,
                                });

                                compare(
                                    { expected: cQuery, received: cypherQuery },
                                    { expected: cQueryParams, received: cypherParams },
                                    mergedContext
                                );

                                return {
                                    [pluralize(camelCase(def.name.value))]: [],
                                };
                            },
                            [`delete${pluralize(def.name.value)}`]: (_root: any, _params: any, context: any, info) => {
                                const resolveTree = getNeo4jResolveTree(info);

                                context.neoSchema = neoSchema;
                                context.resolveTree = resolveTree;

                                const mergedContext = { ...context, ...defaultContext };

                                const [cQuery, cQueryParams] = translateDelete({
                                    context: mergedContext,
                                    node: neoSchema.nodes.find((x) => x.name === def.name.value) as Node,
                                });

                                compare(
                                    { expected: cQuery, received: cypherQuery },
                                    { expected: cQueryParams, received: cypherParams },
                                    mergedContext
                                );

                                return { nodesDeleted: 1, relationshipsDeleted: 1 };
                            },
                        };
                    }, {});

                    const resolvers = {
                        Query: queries,
                        Mutation: mutations,
                        ...Object.entries(Scalars).reduce((res, [name, scalar]) => {
                            if (printSchema(neoSchema.schema).includes(`scalar ${name}\n`)) {
                                res[name] = scalar;
                            }
                            return res;
                        }, {}),
                    };

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

                    // @ts-ignore
                    const executableSchema = neoSchema.createWrappedSchema({
                        schema: makeExecutableSchema({
                            typeDefs: printSchema(neoSchema.schema),
                            resolvers,
                            ...customScalars,
                            schemaDirectives: directives,
                        }),
                        config: {
                            // @ts-ignore
                            driver: {},
                            // @ts-ignore
                            driverConfig: {},
                        },
                    });

                    const result = await graphql(executableSchema, graphQlQuery, null, defaultContext, graphQlParams);

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
                    // @ts-ignore
                    const neoSchema = new Neo4jGraphQL({ typeDefs, driver: {} });

                    const schemaOutPut = test.schemaOutPut as string;
                    const outPutSchema = makeExecutableSchema({ typeDefs: schemaOutPut });

                    expect(printSchemaWithDirectives(lexicographicSortSchema(neoSchema.schema))).toEqual(
                        printSchemaWithDirectives(lexicographicSortSchema(outPutSchema))
                    );
                });
            }
            unsetTestEnvVars(envVars);
        });
    });
});
