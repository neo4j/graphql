import { describe, test, expect } from "@jest/globals";
import { generate } from "randomstring";
import createAuthAndParams from "../../../src/translate/create-auth-and-params";
import { NeoSchema, Context, Node } from "../../../src/classes";
import { trimmer } from "../../../src/utils";

describe("createAuthAndParams", () => {
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
                    rules: [{ allow: { AND: [{ id: "sub" }, { id: "sub" }, { id: "sub" }] } }],
                    type: "JWT",
                },
            };

            // @ts-ignore
            const neoSchema: NeoSchema = {
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
                    (this.id = $this_auth_allow0_AND0_id AND this.id = $this_auth_allow0_AND1_id AND this.id = $this_auth_allow0_AND2_id)
                `)
            );

            expect(result[1]).toMatchObject({
                this_auth_allow0_AND0_id: sub,
                this_auth_allow0_AND1_id: sub,
                this_auth_allow0_AND2_id: sub,
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
                    rules: [{ allow: { OR: [{ id: "sub" }, { id: "sub" }, { id: "sub" }] } }],
                    type: "JWT",
                },
            };

            // @ts-ignore
            const neoSchema: NeoSchema = {
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
                    (this.id = $this_auth_allow0_OR0_id OR this.id = $this_auth_allow0_OR1_id OR this.id = $this_auth_allow0_OR2_id)
                `)
            );

            expect(result[1]).toMatchObject({
                this_auth_allow0_OR0_id: sub,
                this_auth_allow0_OR1_id: sub,
                this_auth_allow0_OR2_id: sub,
            });
        });
    });
});
