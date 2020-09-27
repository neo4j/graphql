/* eslint-disable @typescript-eslint/ban-ts-comment */
import { parse, ObjectTypeDefinitionNode } from "graphql";
import getFieldTypeMeta from "../../../src/graphql/get-field-type-meta";

describe("getFieldTypeMeta", () => {
    test("should return NonNullType ListType type name", () => {
        const typeDefs = `
            type User {
                name: [ABC]!
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        // @ts-ignore
        const field = node.fields[0];

        const res = getFieldTypeMeta(field);

        expect(res).toMatchObject({
            name: "ABC",
            required: true,
            array: true,
            pretty: "[ABC]!",
            prettyBy: res.prettyBy,
        });
    });

    test("should return NonNullType NamedType type name", () => {
        const typeDefs = `
            type User {
                name: ABC!
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        // @ts-ignore
        const field = node.fields[0];

        const res = getFieldTypeMeta(field);

        expect(res).toMatchObject({
            name: "ABC",
            required: true,
            array: false,
            pretty: "ABC!",
            prettyBy: res.prettyBy,
        });
    });

    test("should return NamedType type name", () => {
        const typeDefs = `
            type User {
                name: String
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        // @ts-ignore
        const field = node.fields[0];

        const res = getFieldTypeMeta(field);

        expect(res).toMatchObject({
            name: "String",
            required: false,
            array: false,
            pretty: "String",
            prettyBy: res.prettyBy,
        });
    });

    test("should return ListType NamedType type name", () => {
        const typeDefs = `
            type User {
                name: [ABC]
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        // @ts-ignore
        const field = node.fields[0];

        const res = getFieldTypeMeta(field);

        expect(res).toMatchObject({
            name: "ABC",
            required: false,
            array: true,
            pretty: "[ABC]",
            prettyBy: res.prettyBy,
        });
    });

    test("should return ListType NonNullType type name", () => {
        const typeDefs = `
            type User {
                name: [ABC!]
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        // @ts-ignore
        const field = node.fields[0];

        const res = getFieldTypeMeta(field);

        expect(res).toMatchObject({
            name: "ABC",
            required: true,
            array: true,
            pretty: "[ABC!]",
            prettyBy: res.prettyBy,
        });
    });
});
