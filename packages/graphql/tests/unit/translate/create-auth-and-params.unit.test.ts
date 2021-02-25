import { describe, test, expect } from "@jest/globals";
import { generate } from "randomstring";
import createAuthAndParams from "../../../src/translate/create-auth-and-params";
import { Neo4jGraphQL, Context, Node } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

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
                        name: "String",
                        pretty: "String",
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
                        { operations: "*", allow: { id: "$jwt.sub" } },
                        { operations: ["create"], roles: ["admin"] },
                        { operations: "*", roles: ["admin"] },
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
            const context = new Context({ neoSchema });
            context.jwt = {
                sub,
            };

            const result = createAuthAndParams({
                context,
                entity: node,
                operation: "read",
                allow: { parentNode: node, varName: "this" },
            });

            expect(trimmer(result[0])).toEqual(
                trimmer(`
                    EXISTS(this.id) AND this.id = $this_auth_allow0_id OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
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
                        name: "String",
                        pretty: "String",
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
            const context = new Context({ neoSchema });
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
                    EXISTS(this.id) AND this.id = $this_auth_allow0_id OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
                `)
            );

            expect(result[1]).toMatchObject({
                this_auth_allow0_id: sub,
            });
        });

        test("should showcase the default AND default behavior of the keys in the rule", async () => {
            const idField = {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: false,
                    pretty: "String",
                    input: {
                        name: "String",
                        pretty: "String",
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
            const context = new Context({ neoSchema });
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
                     ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) AND EXISTS(this.id) AND this.id = $this_auth_allow0_id
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
                            name: "String",
                            pretty: "String",
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
                const context = new Context({ neoSchema });
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
                        EXISTS(this.id) AND this.id = $this${key}0_auth_allow0_id ${key} ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
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
                        name: "String",
                        pretty: "String",
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
            const context = new Context({ neoSchema });
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
                    EXISTS(this.id) AND this.id = $this_auth_allow0_id 
                AND 
                    EXISTS(this.id) AND this.id = $thisAND0_auth_allow0_id AND ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr)) 
                AND 
                    EXISTS(this.id) AND this.id = $thisOR0_auth_allow0_id OR ANY(r IN ["admin"] WHERE ANY(rr IN $auth.roles WHERE r = rr))
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
                            name: "String",
                            pretty: "String",
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
                                    name: "String",
                                    pretty: "String",
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
                const context = new Context({ neoSchema });
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
                        (EXISTS(this.id) AND this.id = $this_auth_allow0_${key}0_id ${key} EXISTS(this.id) AND this.id = $this_auth_allow0_${key}1_id ${key} EXISTS(this.id) AND this.id = $this_auth_allow0_${key}2_id)
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
});
