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
import createAuthAndParams from "./create-auth-and-params";
import { Neo4jGraphQL, Node } from "../classes";
import { trimmer } from "../utils";

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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$jwt.sub" } },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            };

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
                operation: "READ",
                allow: { parentNode: node, varName: "this" },
            });

            expect(trimmer(result[0])).toEqual(
                trimmer(`
                    this.id IS NOT NULL AND this.id = $this_auth_allow0_id OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                `)
            );

            expect(result[1]).toMatchObject({
                this_auth_allow0_id: sub,
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }],
                    type: "JWT",
                },
            };

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

            expect(trimmer(result[0])).toEqual(
                trimmer(`
                    this.id IS NOT NULL AND this.id = $this_auth_allow0_id OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                `)
            );

            expect(result[1]).toMatchObject({
                this_auth_allow0_id: sub,
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [{ allow: { id: "$jwt.sub" }, roles: ["admin"] }],
                    type: "JWT",
                },
            };

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

            expect(trimmer(result[0])).toEqual(
                trimmer(`
                     ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND this.id IS NOT NULL AND this.id = $this_auth_allow0_id
                `)
            );

            expect(result[1]).toMatchObject({
                this_auth_allow0_id: sub,
            });
        });
    });

    describe("top-level keys", () => {
        test("AND OR", () => {
            ["AND", "OR"].forEach((key) => {
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
                const node: Node = {
                    name: "Movie",
                    relationFields: [],
                    cypherFields: [],
                    enumFields: [],
                    scalarFields: [],
                    primitiveFields: [idField],
                    dateTimeFields: [],
                    interfaceFields: [],
                    objectFields: [],
                    pointFields: [],
                    authableFields: [idField],
                    auth: {
                        rules: [{ [key]: [{ allow: { id: "$jwt.sub" } }, { roles: ["admin"] }] }],
                        type: "JWT",
                    },
                };

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

                expect(trimmer(result[0])).toEqual(
                    trimmer(`
                        this.id IS NOT NULL AND this.id = $this${key}0_auth_allow0_id ${key} ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                    `)
                );

                expect(result[1]).toMatchObject({
                    [`this${key}0_auth_allow0_id`]: sub,
                });
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
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
            };

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

            expect(trimmer(result[0])).toEqual(
                trimmer(`
                    ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                AND
                    this.id IS NOT NULL AND this.id = $this_auth_allow0_id
                AND
                    this.id IS NOT NULL AND this.id = $thisAND0_auth_allow0_id AND ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                AND
                    this.id IS NOT NULL AND this.id = $thisOR0_auth_allow0_id OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                `)
            );

            expect(result[1]).toMatchObject({
                [`this_auth_allow0_id`]: sub,
                [`thisAND0_auth_allow0_id`]: sub,
                [`thisOR0_auth_allow0_id`]: sub,
            });
        });
    });

    describe("allow", () => {
        test("AND OR", () => {
            ["AND", "OR"].forEach((key) => {
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
                const node: Node = {
                    name: "Movie",
                    relationFields: [],
                    cypherFields: [],
                    enumFields: [],
                    scalarFields: [],
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
                    dateTimeFields: [],
                    interfaceFields: [],
                    objectFields: [],
                    pointFields: [],
                    authableFields: [idField],
                    auth: {
                        rules: [{ allow: { [key]: [{ id: "$jwt.sub" }, { id: "$jwt.sub" }, { id: "$jwt.sub" }] } }],
                        type: "JWT",
                    },
                };

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

                expect(trimmer(result[0])).toEqual(
                    trimmer(`
                        (this.id IS NOT NULL AND this.id = $this_auth_allow0_${key}0_id ${key} this.id IS NOT NULL AND this.id = $this_auth_allow0_${key}1_id ${key} this.id IS NOT NULL AND this.id = $this_auth_allow0_${key}2_id)
                    `)
                );

                expect(result[1]).toMatchObject({
                    [`this_auth_allow0_${key}0_id`]: sub,
                    [`this_auth_allow0_${key}1_id`]: sub,
                    [`this_auth_allow0_${key}2_id`]: sub,
                });
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$jwt.sub" } },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            };

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
                    operation: "READ",
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$context.nop" } },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            };

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
                    operation: "READ",
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$jwt.sub" }, allowUnauthenticated: true },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            };

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            // @ts-ignore
            const context: Context = { neoSchema, jwt: {} };

            const result = createAuthAndParams({
                context,
                entity: node,
                operation: "READ",
                allow: { parentNode: node, varName: "this" },
            });

            expect(trimmer(result[0])).toEqual(trimmer('false OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))'));
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

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                relationFields: [],
                cypherFields: [],
                enumFields: [],
                scalarFields: [],
                primitiveFields: [idField],
                dateTimeFields: [],
                interfaceFields: [],
                objectFields: [],
                pointFields: [],
                authableFields: [idField],
                auth: {
                    rules: [
                        { allow: { id: "$context.nop" }, allowUnauthenticated: true },
                        { operations: ["CREATE"], roles: ["admin"] },
                        { roles: ["admin"] },
                    ],
                    type: "JWT",
                },
            };

            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {
                nodes: [node],
            };

            // @ts-ignore
            const context: Context = { neoSchema, jwt: {} };

            const result = createAuthAndParams({
                context,
                entity: node,
                operation: "READ",
                allow: { parentNode: node, varName: "this" },
            });

            expect(trimmer(result[0])).toEqual(trimmer('false OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))'));
            expect(result[1]).toEqual({});
        });
    });
});
