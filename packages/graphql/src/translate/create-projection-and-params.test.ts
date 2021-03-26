import createProjectionAndParams from "./create-projection-and-params";
import { Neo4jGraphQL, Node } from "../classes";
import { Context } from "../types";

describe("createProjectionAndParams", () => {
    test("should be a function", () => {
        expect(createProjectionAndParams).toBeInstanceOf(Function);
    });

    test("should return the correct projection with 1 selection", () => {
        const fieldsByTypeName = {
            Movie: {
                title: {
                    name: "title",
                    alias: "title",
                    args: {},
                    fieldsByTypeName: {},
                },
            },
        };

        // @ts-ignore
        const node: Node = {
            name: "Movie",
            relationFields: [],
            cypherFields: [],
            enumFields: [],
            unionFields: [],
            scalarFields: [],
            primitiveFields: [
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
                            create: { type: "String", pretty: "String" },
                            update: { type: "String", pretty: "String" },
                        },
                    },
                    otherDirectives: [],
                    arguments: [],
                },
            ],
            dateTimeFields: [],
            pointFields: [],
            interfaceFields: [],
            objectFields: [],
            authableFields: [],
            mutableFields: [],
        };

        // @ts-ignore
        const neoSchema: Neo4jGraphQL = {
            nodes: [node],
        };

        // @ts-ignore
        const context: Context = { neoSchema };

        const result = createProjectionAndParams({ fieldsByTypeName, node, context, varName: "this" });

        expect(result[0]).toEqual(`{ .title }`);
        expect(result[1]).toMatchObject({});
    });
});
