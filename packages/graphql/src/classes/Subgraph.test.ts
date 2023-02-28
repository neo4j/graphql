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

import gql from "graphql-tag";
import { Subgraph } from "./Subgraph";

describe("Subgraph", () => {
    describe("findFederationLinkMeta", () => {
        test("can find link directive in schema definition", () => {
            const typeDefs = gql`
                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location @key(fields: "id") {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }

                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])
            `;

            // @ts-ignore
            const plugin = new Subgraph(typeDefs);

            expect(plugin["findFederationLinkMeta"](typeDefs)?.directive.name.value).toBe("link");
        });

        test("can find link directive in schema extension", () => {
            const typeDefs = gql`
                extend schema @link(url: "https://specs.apollo.dev/federation/v2.0", import: ["@key"])

                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location @key(fields: "id") {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }
            `;

            // @ts-ignore
            const plugin = new Subgraph(typeDefs);

            expect(plugin["findFederationLinkMeta"](typeDefs)?.directive.name.value).toBe("link");
        });

        test("returns undefined if link directive imports non-Federation schema", () => {
            const typeDefs = gql`
                extend schema
                    @link(
                        url: "https://example.com/otherSchema"
                        import: ["SomeType", "@someDirective", { name: "@someRenamedDirective", as: "@renamed" }]
                    )

                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }
            `;

            // findFederationLinkMeta called in constructor
            // @ts-ignore
            expect(() => new Subgraph(typeDefs)).toThrow(
                "typeDefs must contain `@link` schema extension to be used with Apollo Federation",
            );
        });

        test("returns undefined if directive is not defined", () => {
            const typeDefs = gql`
                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }
            `;

            // findFederationLinkMeta called in constructor
            // @ts-ignore
            expect(() => new Subgraph(typeDefs)).toThrow(
                "typeDefs must contain `@link` schema extension to be used with Apollo Federation",
            );
        });
    });

    describe("parseLinkImportArgument", () => {
        test("parses valid directive", () => {
            const typeDefs = gql`
                extend schema
                    @link(
                        url: "https://specs.apollo.dev/federation/v2.0"
                        import: [
                            "@key"
                            { name: "@shareable", as: "@shared" }
                            { name: "@external", as: "@ext" }
                            "@requires"
                        ]
                    )

                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location @key(fields: "id") {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }
            `;

            // @ts-ignore
            const plugin = new Subgraph(typeDefs);

            const directive = plugin["findFederationLinkMeta"](typeDefs)?.directive;
            expect(directive).toBeDefined();

            plugin["parseLinkImportArgument"](directive as any);

            expect(plugin["importArgument"]).toEqual(
                new Map([
                    ["key", "key"],
                    ["shareable", "shared"],
                    ["inaccessible", "federation__inaccessible"],
                    ["override", "federation__override"],
                    ["external", "ext"],
                    ["provides", "federation__provides"],
                    ["requires", "requires"],
                    ["tag", "federation__tag"],
                    ["extends", "federation__extends"],
                ]),
            );
        });

        test("throws an error for invalid Federation directive", () => {
            const typeDefs = gql`
                extend schema
                    @link(
                        url: "https://specs.apollo.dev/federation/v2.0"
                        import: [
                            "@key"
                            { name: "@shareable", as: "@shared" }
                            { name: "@external", as: "@ext" }
                            "@banana"
                        ]
                    )

                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location @key(fields: "id") {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }
            `;

            // @ts-ignore
            expect(() => new Subgraph(typeDefs)).toThrow("Encountered unknown Apollo Federation directive @banana");
        });

        test("throws an error alias of non-string type", () => {
            const typeDefs = gql`
                extend schema
                    @link(
                        url: "https://specs.apollo.dev/federation/v2.0"
                        import: [
                            "@key"
                            { name: "@shareable", as: "@shared" }
                            { name: "@external", as: 4 }
                            "@requires"
                        ]
                    )

                type Query {
                    "The full list of locations presented by the Interplanetary Space Tourism department"
                    locations: [Location!]!
                    "The details of a specific location"
                    location(id: ID!): Location
                }

                type Location @key(fields: "id") {
                    id: ID!
                    "The name of the location"
                    name: String!
                    "A short description about the location"
                    description: String!
                    "The location's main photo as a URL"
                    photo: String!
                }
            `;

            // @ts-ignore
            expect(() => new Subgraph(typeDefs)).toThrow("Alias for directive @external is not of type string");
        });
    });
});
