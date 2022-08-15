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

import { generate } from "randomstring";
import { createAuthAndParams } from "./create-auth-and-params";
import type { Neo4jGraphQL } from "../classes";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";
import { ContextBuilder } from "../../tests/utils/builders/context-builder";

describe("createAuthAndParams", () => {
    describe("operations", () => {
        test("should cover all rules when using operations *", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$jwt.sub" } },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema, jwt: { sub } };

            const result = createAuthAndParams({
                context,
                entity: node,
                operations: "READ",
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"((this.id IS NOT NULL AND this.id = $thisauth_param0) OR any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))"`
            );

            expect(result[1]).toMatchObject({
                thisauth_param0: sub,
            });
        });

        test("should combine roles with where across rules", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        {
                            operations: ["READ"],
                            roles: ["admin"],
                        },
                        {
                            operations: ["READ"],
                            roles: ["member"],
                            where: { id: "$jwt.sub" },
                        },
                    ],
                    type: "JWT",
                },
            }).instance();

            const sub = generate({
                charset: "alphabetic",
            });

            const context = new ContextBuilder({
                jwt: {
                    sub,
                },
            }).instance();

            const result = createAuthAndParams({
                context,
                entity: node,
                where: { node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"(any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)) OR (any(auth_var3 IN [\\"member\\"] WHERE any(auth_var2 IN $auth.roles WHERE auth_var2 = auth_var3)) AND (this.id IS NOT NULL AND this.id = $thisauth_param2)))"`
            );

            expect(result[1]).toMatchObject({
                thisauth_param2: sub,
            });
        });
    });

    describe("rules", () => {
        test("should showcase the default OR behavior of stacked rules", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"((this.id IS NOT NULL AND this.id = $thisauth_param0) OR any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))"`
            );

            expect(result[1]).toMatchObject({
                thisauth_param0: sub,
            });
        });

        test("should showcase the default AND default behavior of the keys in the rule", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [{ allow: { id: "$jwt.sub" }, roles: ["admin"] }],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"(any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)) AND (this.id IS NOT NULL AND this.id = $thisauth_param1))"`
            );
            expect(result[1]).toMatchObject({
                thisauth_param1: sub,
            });
        });
    });

    describe("top-level keys", () => {
        test("AND", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [{ AND: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }] }],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"((this.id IS NOT NULL AND this.id = $thisauth_param0) AND any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))"`
            );

            expect(result[1]).toMatchObject({
                thisauth_param0: sub,
            });
        });

        test("OR", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [{ OR: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }] }],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"((this.id IS NOT NULL AND this.id = $thisauth_param0) OR any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))"`
            );
            expect(result[1]).toMatchObject({
                thisauth_param0: sub,
            });
        });

        test("all keys used together", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        {
                            roles: ["admin"],
                            allow: { id: "$jwt.sub" },
                            AND: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }],
                            OR: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }],
                        },
                    ],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"(any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)) AND (this.id IS NOT NULL AND this.id = $thisauth_param1) AND ((this.id IS NOT NULL AND this.id = $thisauth_param2) AND any(auth_var3 IN [\\"admin\\"] WHERE any(auth_var2 IN $auth.roles WHERE auth_var2 = auth_var3))) AND ((this.id IS NOT NULL AND this.id = $thisauth_param4) OR any(auth_var5 IN [\\"admin\\"] WHERE any(auth_var4 IN $auth.roles WHERE auth_var4 = auth_var5))))"`
            );

            expect(result[1]).toMatchObject({
                thisauth_param1: sub,
                thisauth_param2: sub,
                thisauth_param4: sub,
            });
        });
    });

    describe("allow", () => {
        test("AND", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            // @ts-ignore
            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [
                    idField,
                    {
                        fieldName: "title",
                        typeMeta: {
                            name: "String",
                            array: false,
                            required: false,
                            pretty: "String",
                            input: {
                                where: {
                                    type: "String",
                                    pretty: "String",
                                },
                                create: {
                                    type: "String",
                                    pretty: "String",
                                },
                                update: {
                                    type: "String",
                                    pretty: "String",
                                },
                            },
                        },
                        otherDirectives: [],
                        arguments: [],
                    },
                ],
                temporalFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                auth: {
                    rules: [{ allow: { AND: [{ id: "$jwt.sub" }, { id: "$jwt.sub" }, { id: "$jwt.sub" }] } }],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"((this.id IS NOT NULL AND this.id = $thisauth_param0) AND (this.id IS NOT NULL AND this.id = $thisauth_param1) AND (this.id IS NOT NULL AND this.id = $thisauth_param2))"`
            );

            expect(result[1]).toMatchObject({
                thisauth_param0: sub,
                thisauth_param1: sub,
                thisauth_param2: sub,
            });
        });

        test("OR", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            // @ts-ignore
            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [
                    idField,
                    {
                        fieldName: "title",
                        typeMeta: {
                            name: "String",
                            array: false,
                            required: false,
                            pretty: "String",
                            input: {
                                where: {
                                    type: "String",
                                    pretty: "String",
                                },
                                create: {
                                    type: "String",
                                    pretty: "String",
                                },
                                update: {
                                    type: "String",
                                    pretty: "String",
                                },
                            },
                        },
                        otherDirectives: [],
                        arguments: [],
                    },
                ],
                temporalFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                auth: {
                    rules: [{ allow: { OR: [{ id: "$jwt.sub" }, { id: "$jwt.sub" }, { id: "$jwt.sub" }] } }],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            const sub = generate({
                charset: "alphabetic",
            });

            // @ts-ignore
            const context: Context = { neoSchema };
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"((this.id IS NOT NULL AND this.id = $thisauth_param0) OR (this.id IS NOT NULL AND this.id = $thisauth_param1) OR (this.id IS NOT NULL AND this.id = $thisauth_param2))"`
            );
            expect(result[1]).toMatchObject({
                thisauth_param0: sub,
                thisauth_param1: sub,
                thisauth_param2: sub,
            });
        });
    });

    describe("params", () => {
        test("should throw if $jwt value is undefined", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$jwt.sub" } },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            // @ts-ignore
            const context: Context = { neoSchema, jwt: {} };

            expect(() => {
                createAuthAndParams({
                    context,
                    entity: node,
                    operations: "READ",
                    allow: { parentNode: node, varName: "this" },
                });
            }).toThrow("Unauthenticated");
        });

        test("should throw if $context value is undefined", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$context.nop" } },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            // @ts-ignore
            const context: Context = { neoSchema, jwt: {} };

            expect(() => {
                createAuthAndParams({
                    context,
                    entity: node,
                    operations: "READ",
                    allow: { parentNode: node, varName: "this" },
                });
            }).toThrow("Unauthenticated");
        });

        test("should showcase the allowUnauthenticated behavior with undefined $jwt", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$jwt.sub" }, allowUnauthenticated: true },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            // @ts-ignore
            const context: Context = { neoSchema, jwt: {} };

            const result = createAuthAndParams({
                context,
                entity: node,
                operations: "READ",
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"(false OR any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))"`
            );
            expect(result[1]).toEqual({});
        });

        test("should showcase the allowUnauthenticated behavior with undefined $context", () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                        create: {
                            type: "String",
                            pretty: "String",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
            };

            const node = new NodeBuilder({
                name: "Movie",
                primitiveFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$context.nop" }, allowUnauthenticated: true },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            }).instance();

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            // @ts-ignore
            const context: Context = { neoSchema, jwt: {} };

            const result = createAuthAndParams({
                context,
                entity: node,
                operations: "READ",
                allow: { parentNode: node, varName: "this" },
            });

            expect(result[0]).toMatchInlineSnapshot(
                `"(false OR any(auth_var1 IN [\\"admin\\"] WHERE any(auth_var0 IN $auth.roles WHERE auth_var0 = auth_var1)))"`
            );
            expect(result[1]).toEqual({});
        });
    });
});
