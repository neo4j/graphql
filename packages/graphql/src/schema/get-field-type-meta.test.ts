/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { FieldDefinitionNode, ObjectTypeDefinitionNode } from "graphql";
import { parse } from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";

describe("getFieldTypeMeta", () => {
    test("should return NonNullType ListType type name", () => {
        const typeDefs = `
            type User @node {
                name: [ABC]!
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        const field = node.fields?.[0] as FieldDefinitionNode;

        const res = getFieldTypeMeta(field.type);

        expect(res).toMatchObject({
            name: "ABC",
            required: true,
            array: true,
            pretty: "[ABC]!",
        });
    });

    test("should return NonNullType NamedType type name", () => {
        const typeDefs = `
            type User @node {
                name: ABC!
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        const field = node.fields?.[0] as FieldDefinitionNode;

        const res = getFieldTypeMeta(field.type);

        expect(res).toMatchObject({
            name: "ABC",
            required: true,
            array: false,
            pretty: "ABC!",
        });
    });

    test("should return NamedType type name", () => {
        const typeDefs = `
            type User @node {
                name: String
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        const field = node.fields?.[0] as FieldDefinitionNode;

        const res = getFieldTypeMeta(field.type);

        expect(res).toMatchObject({
            name: "String",
            required: false,
            array: false,
            pretty: "String",
        });
    });

    test("should return ListType NamedType type name", () => {
        const typeDefs = `
            type User @node {
                name: [ABC]
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        const field = node.fields?.[0] as FieldDefinitionNode;

        const res = getFieldTypeMeta(field.type);

        expect(res).toMatchObject({
            name: "ABC",
            required: false,
            array: true,
            pretty: "[ABC]",
        });
    });

    test("should return ListType NonNullType type name", () => {
        const typeDefs = `
            type User @node {
                name: [ABC!]
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        const field = node.fields?.[0] as FieldDefinitionNode;

        const res = getFieldTypeMeta(field.type);

        expect(res).toMatchObject({
            name: "ABC",
            required: false,
            array: true,
            pretty: "[ABC!]",
        });
    });
});
