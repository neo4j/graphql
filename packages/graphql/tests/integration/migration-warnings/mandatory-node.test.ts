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

import { Neo4jGraphQL } from "../../../src/classes";

describe("mandatory @node warnings", () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
        warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockReset();
    });

    test("type without @node directive should produces a warn message", async () => {
        const typeDefsWithoutNodeDirective = /* GraphQL */ `
            type User {
                id: ID!
                firstName: String!
                lastName: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithoutNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).toHaveBeenCalledWith(
            "Future library versions will require marking all types representing Neo4j nodes with the @node directive."
        );
    });

    test("multiple types without @node directive should warn only once", async () => {
        const typeDefsWithoutNodeDirective = /* GraphQL */ `
            type User {
                id: ID!
                firstName: String!
                lastName: String!
            }
            type Movie {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithoutNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).toHaveBeenCalledTimes(1);
    });

    test("type with @node directive should not produces a warn message", async () => {
        const typeDefsWithNodeDirective = /* GraphQL */ `
            type User @node {
                id: ID!
                firstName: String!
                lastName: String!
            }
            type Movie @node(labels: ["Film"]) {
                id: ID!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).not.toHaveBeenCalled();
    });

    test("type with @jwt directive should not produces a warn message", async () => {
        const typeDefsWithNodeDirective = /* GraphQL */ `
            type User @node {
                id: ID!
                firstName: String!
                lastName: String!
            }

            type JWT @jwt {
                roles: [String!]!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).not.toHaveBeenCalled();
    });

    test("type with @relationshipProperties directive should not produces a warn message", async () => {
        const typeDefsWithNodeDirective = /* GraphQL */ `
            type Series @node {
                title: String!
                cost: Float!
                episodes: Int!
            }
            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
            type Actor @node {
                name: String!
                actedIn: [Series!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).not.toHaveBeenCalled();
    });

    test("type implementing an interface should not produces a warn message when the @node is being used", async () => {
        const typeDefsWithNodeDirective = /* GraphQL */ `
            interface Person {
                name: String!
            }

            type Actor implements Person @node {
                name: String!
                role: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).not.toHaveBeenCalled();
    });

    test("extended type should not produces a warn message when the @node is being used", async () => {
        const typeDefsWithNodeDirective = /* GraphQL */ `
            type Actor {
                name: String!
                role: String!
            }
            extend type Actor @node {
                age: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({
            typeDefs: typeDefsWithNodeDirective,
            validate: true,
        });
        await neoSchema.getSchema();
        expect(warn).not.toHaveBeenCalled();
    });
});
