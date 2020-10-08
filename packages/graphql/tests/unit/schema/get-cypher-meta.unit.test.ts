/* eslint-disable @typescript-eslint/ban-ts-comment */
import { FieldDefinitionNode } from "graphql";
import getCypherMeta from "../../../src/schema/get-cypher-meta";

describe("getCypherMeta", () => {
    test("should return undefined if no directive found", () => {
        // @ts-ignore
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: { value: "RANDOM 1" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
        };

        const result = getCypherMeta(field);

        expect(result).toEqual(undefined);
    });

    test("should throw statement required", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: { value: "cypher", arguments: [] },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
        };

        try {
            getCypherMeta(field);

            throw new Error("I should not throw");
        } catch (error) {
            expect(error.message).toEqual("@cypher statement required");
        }
    });

    test("should throw statement not a string", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "cypher",
                        // @ts-ignore
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "statement" },
                            // @ts-ignore
                            value: { kind: "NOT A STRING!" },
                        },
                    ],
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
        };

        try {
            getCypherMeta(field);

            throw new Error("I should not throw");
        } catch (error) {
            expect(error.message).toEqual("@cypher statement not a string");
        }
    });

    test("should return the correct meta", () => {
        const field: FieldDefinitionNode = {
            directives: [
                {
                    // @ts-ignore
                    name: {
                        value: "cypher",
                    },
                    arguments: [
                        {
                            // @ts-ignore
                            name: { value: "statement" },
                            // @ts-ignore
                            value: { kind: "StringValue", value: "MATCH (m:Movie) RETURN m" },
                        },
                    ],
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 2" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 3" },
                },
                {
                    // @ts-ignore
                    name: { value: "RANDOM 4" },
                },
            ],
        };

        const result = getCypherMeta(field);

        expect(result).toMatchObject({
            statement: "MATCH (m:Movie) RETURN m",
        });
    });
});
