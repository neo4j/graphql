import { mergeTypeDefs } from "@graphql-tools/merge";
import { InterfaceTypeDefinitionNode } from "graphql";
import getRelationshipFieldMeta from "./get-relationship-field-meta";

describe("getRelationshipFieldMeta", () => {
    test("returns expected field metadata", () => {
        const typeDefs = `
            interface TestRelationship {
                id: ID!
                string: String!
                int: Int!
                float: Float!
                dateTime: DateTime!
                point: Point!
            }
        `;

        const documentNode = mergeTypeDefs([typeDefs]);

        const relationship = documentNode.definitions.find(
            (d) => d.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        const fieldMeta = getRelationshipFieldMeta({ relationship });

        expect(fieldMeta).toEqual([
            {
                fieldName: "id",
                typeMeta: {
                    name: "ID",
                    array: false,
                    required: true,
                    pretty: "ID!",
                    arrayTypePretty: "",
                    input: {
                        create: {
                            type: "ID",
                            pretty: "ID!",
                        },
                        update: {
                            type: "ID",
                            pretty: "ID",
                        },
                        where: {
                            type: "ID",
                            pretty: "ID",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
                description: undefined,
                readonly: false,
                writeonly: false,
            },
            {
                fieldName: "string",
                typeMeta: {
                    name: "String",
                    array: false,
                    required: true,
                    pretty: "String!",
                    arrayTypePretty: "",
                    input: {
                        create: {
                            type: "String",
                            pretty: "String!",
                        },
                        update: {
                            type: "String",
                            pretty: "String",
                        },
                        where: {
                            type: "String",
                            pretty: "String",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
                description: undefined,
                readonly: false,
                writeonly: false,
            },
            {
                fieldName: "int",
                typeMeta: {
                    name: "Int",
                    array: false,
                    required: true,
                    pretty: "Int!",
                    arrayTypePretty: "",
                    input: {
                        create: {
                            type: "Int",
                            pretty: "Int!",
                        },
                        update: {
                            type: "Int",
                            pretty: "Int",
                        },
                        where: {
                            type: "Int",
                            pretty: "Int",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
                description: undefined,
                readonly: false,
                writeonly: false,
            },
            {
                fieldName: "float",
                typeMeta: {
                    name: "Float",
                    array: false,
                    required: true,
                    pretty: "Float!",
                    arrayTypePretty: "",
                    input: {
                        create: {
                            type: "Float",
                            pretty: "Float!",
                        },
                        update: {
                            type: "Float",
                            pretty: "Float",
                        },
                        where: {
                            type: "Float",
                            pretty: "Float",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
                description: undefined,
                readonly: false,
                writeonly: false,
            },
            {
                fieldName: "dateTime",
                typeMeta: {
                    name: "DateTime",
                    array: false,
                    required: true,
                    pretty: "DateTime!",
                    arrayTypePretty: "",
                    input: {
                        create: {
                            type: "DateTime",
                            pretty: "DateTime!",
                        },
                        update: {
                            type: "DateTime",
                            pretty: "DateTime",
                        },
                        where: {
                            type: "DateTime",
                            pretty: "DateTime",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
                description: undefined,
                readonly: false,
                writeonly: false,
            },
            {
                fieldName: "point",
                typeMeta: {
                    name: "Point",
                    array: false,
                    required: true,
                    pretty: "Point!",
                    arrayTypePretty: "",
                    input: {
                        create: {
                            type: "Point",
                            pretty: "PointInput!",
                        },
                        update: {
                            type: "Point",
                            pretty: "PointInput",
                        },
                        where: {
                            type: "PointInput",
                            pretty: "PointInput",
                        },
                    },
                },
                otherDirectives: [],
                arguments: [],
                description: undefined,
                readonly: false,
                writeonly: false,
            },
        ]);
    });
});
