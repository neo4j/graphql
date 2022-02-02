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

import { ObjectTypeDefinitionNode, parse } from "graphql";
import getAuth from "./get-auth";

describe("getAuth", () => {
    test("should throw rules required", () => {
        const typeDefs = `
            type Movie @auth {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules required");
    });

    test("should throw rules must be a ListValue", () => {
        const typeDefs = `
            type Movie @auth(rules: true) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules must be a ListValue");
    });

    test("should throw rules rule invalid field", () => {
        const typeDefs = `
            type Movie @auth(rules: [{banana: "banana"}]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules rule invalid field banana");
    });

    test("should throw operation should be a EnumValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [{operations: ["string"]}]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules rule operations operation should be a EnumValue");
    });

    test("should throw invalid operation", () => {
        const typeDefs = `
            type Movie @auth(rules: [{operations: [INVALID]}]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules rule operations operation invalid INVALID");
    });

    test("should return AuthRule", () => {
        const typeDefs = `
            type Person {
                id: ID
                name: String
            }

            type Movie @auth(rules: [
                { isAuthenticated: true, operations: [CREATE] },
                { roles: ["admin", "publisher"], operations: [UPDATE, DELETE] },
                { roles: ["editors"], operations: [UPDATE] },
                {
                    allow: { author_id: "$jwt.sub", moderator_id: "$jwt.sub" },
                    operations: [UPDATE, DELETE]
                },
                { allow: "*", operations: [UPDATE] },
                { allow: {OR: [{director_id: "$jwt.sub"}, {actor_id: "$jwt.sub"}]}, operations: [UPDATE] },
            ]) {
                id: ID
                title: String
                director: Person! @relationship(type: "DIRECTOR_OF", direction: "IN")
                actor: Person! @relationship(type: "ACTED_IN", direction: "IN")
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions.find((x) => x.name.value === "Movie") as ObjectTypeDefinitionNode)
            .directives[0];

        const auth = getAuth(directive);

        expect(auth).toMatchObject({
            rules: [
                { isAuthenticated: true, operations: ["CREATE"] },
                { roles: ["admin", "publisher"], operations: ["UPDATE", "DELETE"] },
                { roles: ["editors"], operations: ["UPDATE"] },
                { allow: { author_id: "$jwt.sub", moderator_id: "$jwt.sub" }, operations: ["UPDATE", "DELETE"] },
                { allow: "*", operations: ["UPDATE"] },
                { allow: { OR: [{ director_id: "$jwt.sub" }, { actor_id: "$jwt.sub" }] }, operations: ["UPDATE"] },
            ],
            type: "JWT",
        });
    });
});
