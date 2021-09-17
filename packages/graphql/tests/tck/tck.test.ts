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
import { makeExecutableSchema } from "@graphql-tools/schema";
import { SchemaDirectiveVisitor } from "@graphql-tools/utils";
import path from "path";
import pluralize from "pluralize";
import jsonwebtoken from "jsonwebtoken";
import { IncomingMessage } from "http";
import { Socket } from "net";
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

    testCases.forEach(({ schema, tests, file, envVars }) => {
        describe(`${file}`, () => {
            setTestEnvVars(envVars);
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

                    const node = neoSchema.nodes.find((x) => x.name === def.name.value) as Node;
                    return {
                        ...res,
                        [node.getPlural(true)]: (
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
                                node,
                            });

                            compare(
                                { expected: cQuery, received: cypherQuery },
                                { expected: cQueryParams, received: cypherParams },
                                mergedContext
                            );

                            return [];
                        },
                        [`${node.getPlural(true)}Count`]: (
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
                        [`${node.getPlural(true)}Aggregate`]: (
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
                                node,
                            });

                            compare(
                                { expected: cQuery, received: cypherQuery },
                                { expected: cQueryParams, received: cypherParams },
                                mergedContext
                            );

                            const aggregateStringFields = node.primitiveFields
                                .filter((x) => ["String", "ID"].includes(x.typeMeta.name) && !x.typeMeta.array)
                                .reduce((r, field) => ({ ...r, [field.fieldName]: { shortest: 1, longest: 1 } }), {});

                            const dateTimeFields = node.temporalFields
                                .filter((x) => !x.typeMeta.array && x.typeMeta.name === "DateTime")
                                .reduce(
                                    (r, field) => ({
                                        ...r,
                                        [field.fieldName]: {
                                            min: new Date().toISOString(),
                                            max: new Date().toISOString(),
                                        },
                                    }),
                                    {}
                                );

                            const timeFields = node.temporalFields
                                .filter((x) => !x.typeMeta.array && x.typeMeta.name === "Time")
                                .reduce(
                                    (r, field) => ({
                                        ...r,
                                        [field.fieldName]: {
                                            min: new Date().toISOString().split("T")[1],
                                            max: new Date().toISOString().split("T")[1],
                                        },
                                    }),
                                    {}
                                );

                            const localTimeFields = node.temporalFields
                                .filter((x) => !x.typeMeta.array && x.typeMeta.name === "LocalTime")
                                .reduce(
                                    (r, field) => ({
                                        ...r,
                                        [field.fieldName]: {
                                            min: new Date().toISOString().split("T")[1].split("Z")[0],
                                            max: new Date().toISOString().split("T")[1].split("Z")[0],
                                        },
                                    }),
                                    {}
                                );

                            const localDateTimeFields = node.temporalFields
                                .filter((x) => !x.typeMeta.array && x.typeMeta.name === "LocalDateTime")
                                .reduce(
                                    (r, field) => ({
                                        ...r,
                                        [field.fieldName]: {
                                            min: new Date().toISOString().split("Z")[0],
                                            max: new Date().toISOString().split("Z")[0],
                                        },
                                    }),
                                    {}
                                );

                            const numericalAggregateFields = node.primitiveFields
                                .filter(
                                    (x) => ["Float", "Int", "BigInt"].includes(x.typeMeta.name) && !x.typeMeta.array
                                )
                                .reduce(
                                    (r, field) => ({
                                        ...r,
                                        [field.fieldName]: { min: 1, max: 1, average: 12 },
                                    }),
                                    {}
                                );

                            const durationAggregateFields = node.primitiveFields
                                .filter((x) => x.typeMeta.name === "Duration" && !x.typeMeta.array)
                                .reduce((r, field) => {
                                    const duration = `P1Y1M1DT1M`;

                                    return {
                                        ...r,
                                        [field.fieldName]: { min: duration, max: duration },
                                    };
                                }, {});

                            return {
                                count: 1,
                                ...aggregateStringFields,
                                ...dateTimeFields,
                                ...timeFields,
                                ...numericalAggregateFields,
                                ...localTimeFields,
                                ...localDateTimeFields,
                                ...durationAggregateFields,
                            };
                        },
                    };
                }, {});

                const mutations = document.definitions.reduce((res, def) => {
                    if (def.kind !== "ObjectTypeDefinition") {
                        return res;
                    }
                    const node = neoSchema.nodes.find((x) => x.name === def.name.value) as Node;
                    return {
                        ...res,
                        [`create${node.getPlural(false)}`]: (
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
                                node,
                            });

                            compare(
                                { expected: cQuery, received: cypherQuery },
                                { expected: cQueryParams, received: cypherParams },
                                mergedContext
                            );

                            return {
                                [node.getPlural(true)]: [],
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
                                node,
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
                                node,
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
            unsetTestEnvVars(envVars);
        });
    });
});
