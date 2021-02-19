import { describe, test, expect } from "@jest/globals";
import { Neo4jGraphQL, Node } from "../../../src/classes";
import {
    createResolver,
    cypherResolver,
    deleteResolver,
    findResolver,
    updateResolver,
} from "../../../src/schema/resolvers";
import { BaseField } from "../../../src/types";

describe("resolvers", () => {
    describe("find", () => {
        test("should return the correct; type, args and resolve", () => {
            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {};

            // @ts-ignore
            const node: Node = {
                // @ts-ignore
                name: "Movie",
            };

            const result = findResolver({ node, neoSchema });
            expect(result.type).toEqual(`[Movie]!`);
            expect(result.resolve).toBeInstanceOf(Function);
            expect(result.args).toMatchObject({
                where: `MovieWhere`,
                options: `MovieOptions`,
            });
        });
    });

    describe("delete", () => {
        test("should return the correct; type, args and resolve", () => {
            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {};

            // @ts-ignore
            const node: Node = {
                // @ts-ignore
                name: "Movie",
                relationFields: [],
            };

            const result = deleteResolver({ node, neoSchema });
            expect(result.type).toEqual(`DeleteInfo!`);
            expect(result.resolve).toBeInstanceOf(Function);
            expect(result.args).toMatchObject({
                where: `MovieWhere`,
            });
        });
    });

    describe("update", () => {
        test("should return the correct; type, args and resolve", () => {
            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {};

            // @ts-ignore
            const node: Node = {
                name: "Movie",
                // @ts-ignore
                relationFields: [{}, {}],
            };

            const result = updateResolver({ node, neoSchema });
            expect(result.type).toEqual("UpdateMoviesMutationResponse!");
            expect(result.resolve).toBeInstanceOf(Function);
            expect(result.args).toMatchObject({
                where: "MovieWhere",
                update: "MovieUpdateInput",
                connect: "MovieConnectInput",
                disconnect: "MovieDisconnectInput",
            });
        });
    });

    describe("create", () => {
        test("should return the correct; type, args and resolve", () => {
            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {};

            // @ts-ignore
            const node: Node = {
                name: "Movie",
            };

            const result = createResolver({ node, neoSchema });
            expect(result.type).toEqual("CreateMoviesMutationResponse!");
            expect(result.resolve).toBeInstanceOf(Function);
            expect(result.args).toMatchObject({
                input: "[MovieCreateInput]!",
            });
        });
    });

    describe("cypherResolver", () => {
        test("should return the correct; type, args and resolve", () => {
            // @ts-ignore
            const neoSchema: Neo4jGraphQL = {};

            // @ts-ignore
            const field: BaseField = {
                // @ts-ignore
                typeMeta: { name: "Test", pretty: "[Test]" },
                arguments: [],
            };

            const result = cypherResolver({ field, statement: "", neoSchema });
            expect(result.type).toEqual(field.typeMeta.pretty);
            expect(result.resolve).toBeInstanceOf(Function);
            expect(result.args).toMatchObject({});
        });
    });
});
