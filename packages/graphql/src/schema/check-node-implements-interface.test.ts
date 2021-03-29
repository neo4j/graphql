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

import { InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode, parse } from "graphql";
import checkNodeImplementsInterfaces from "./check-node-implements-interfaces";

describe("checkNodeImplementsInterfaces", () => {
    test("should throw incorrect with field", () => {
        const typeDefs = `
                interface Node {
                    id: ID
                }

                type Movie implements Node {
                    title: String!
                }
            `;

        const document = parse(typeDefs);

        const node = document.definitions.find((x) => x.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode;
        const inter = document.definitions.find(
            (x) => x.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        expect(() => checkNodeImplementsInterfaces(node, [inter])).toThrow(
            "type Movie does not implement interface Node correctly"
        );
    });

    test("should throw incorrect with auth directive", () => {
        const typeDefs = `
                interface Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                    id: ID
                }

                type Movie implements Node {
                    id: ID
                    title: String!
                }
            `;

        const document = parse(typeDefs);

        const node = document.definitions.find((x) => x.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode;
        const inter = document.definitions.find(
            (x) => x.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        expect(() => checkNodeImplementsInterfaces(node, [inter])).toThrow(
            "type Movie does not implement interface Node correctly"
        );
    });

    test("should throw incorrect with relationship directive", () => {
        const typeDefs = `
                interface Node {
                    relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                }

                type Movie implements Node {
                    title: String!
                }
            `;

        const document = parse(typeDefs);

        const node = document.definitions.find((x) => x.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode;
        const inter = document.definitions.find(
            (x) => x.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        expect(() => checkNodeImplementsInterfaces(node, [inter])).toThrow(
            "type Movie does not implement interface Node correctly"
        );
    });

    test("should throw incorrect with cypher directive", () => {
        const typeDefs = `
                interface Node {
                    cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
                }

                type Movie implements Node {
                    title: String!
                }
            `;

        const document = parse(typeDefs);

        const node = document.definitions.find((x) => x.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode;
        const inter = document.definitions.find(
            (x) => x.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        expect(() => checkNodeImplementsInterfaces(node, [inter])).toThrow(
            "type Movie does not implement interface Node correctly"
        );
    });

    test("should pass on correct implementation", () => {
        const typeDefs = `
                interface Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                    id: ID
                    relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                    cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
                }

                type Movie implements Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                    id: ID
                    title: String!
                    relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                    cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
                }
            `;

        const document = parse(typeDefs);

        const node = document.definitions.find((x) => x.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode;
        const inter = document.definitions.find(
            (x) => x.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        const result = checkNodeImplementsInterfaces(node, [inter]);

        expect(result).toBeUndefined();
    });
});
