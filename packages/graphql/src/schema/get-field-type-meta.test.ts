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

import { parse, ObjectTypeDefinitionNode } from "graphql";
import getFieldTypeMeta from "./get-field-type-meta";

describe("getFieldTypeMeta", () => {
    test("should throw Matrix arrays not supported", () => {
        const typeDefs = `
            type User {
                name: [[String]]!
            }
          `;

        const node = parse(typeDefs).definitions[0] as ObjectTypeDefinitionNode;

        // @ts-ignore
        const field = node.fields[0];

        expect(() => getFieldTypeMeta(field)).toThrow("Matrix arrays not supported");
    });

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
            required: false,
            array: true,
            pretty: "[ABC!]",
        });
    });
});
