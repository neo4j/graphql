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

import type {
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import gql from "graphql-tag";
import validateDocument from "./validate-document";

const additionalDefinitions = {
    enums: [] as EnumTypeDefinitionNode[],
    interfaces: [] as InterfaceTypeDefinitionNode[],
    unions: [] as UnionTypeDefinitionNode[],
    objects: [] as ObjectTypeDefinitionNode[],
};
describe("directive is required to be in a type with @node", () => {
    test("should raise when @relationship is not used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "relationship" must be in a type with "@node"');
    });

    test("should not raise when @relationship is used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie @node {
                title: String
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow('Directive "relationship" must be in a type with "@node"');
    });

    test("should raise when @cypher is not used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie {
                title: String
                actors: [Actor!]! @cypher(statement: "MATCH (a:Actor) RETURN a", columnName: "a")
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "cypher" must be in a type with "@node"');
    });

    test("should not raise when @cypher is used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie @node {
                title: String
                actors: [Actor!]! @cypher(statement: "MATCH (a:Actor) RETURN a", columnName: "a")
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow('Directive "cypher" must be in a type with "@node"');
    });

    test("should raise when @populatedBy is not used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie {
                title: String
                actors: [Actor!]! @populatedBy(callback: "myCallback")
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {
                    populatedBy: {
                        callbacks: { myCallback: () => "hello" },
                    },
                },
            });
        expect(executeValidate).toThrow('Directive "populatedBy" must be in a type with "@node"');
    });

    test("should not raise when @populatedBy is used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie @node {
                title: String
                actors: [Actor!]! @populatedBy(callback: "myCallback")
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {
                    populatedBy: {
                        callbacks: { myCallback: () => "hello" },
                    },
                },
            });
        expect(executeValidate).not.toThrow('Directive "populatedBy" must be in a type with "@node"');
    });

    test("should raise when @relayId is not used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie {
                title: String
                id: ID! @relayId
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "relayId" must be in a type with "@node"');
    });

    test("should not raise when @relayId is used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie @node {
                title: String
                id: ID! @relayId
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow('Directive "relayId" must be in a type with "@node"');
    });

    test("should raise when @authorization is not used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie {
                id: ID!
                title: String
                actors: [Actor!]! @authorization(validate: [{ where: { id: "1" } }])
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "@authorization" must be in a type with "@node"');
    });

    test("should not raise when @authorization is used within the @node directive", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }
            type Movie @node {
                id: ID!
                title: String
                actors: [Actor!]! @authorization(validate: [{ where: { id: "1" } }])
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow();
    });

    test("should raise when @authorization is not used within the @node directive at object level", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }

            type Movie @authorization(validate: [{ where: { id: "1" } }]) {
                id: ID!
                title: String
                actors: [Actor!]!
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "@authorization" must be in a type with "@node"');
    });

    test("should not raise when @authorization is used within the @node directive at object level", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }

            type Movie @node @authorization(validate: [{ where: { id: "1" } }]) {
                id: ID!
                title: String
                actors: [Actor!]!
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow();
    });

    test("should raise when @authorization is not used within the @node directive in type extension", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }

            type Movie {
                id: ID!
                title: String
            }

            extend type Movie @authorization(validate: [{ where: { id: "1" } }]) {
                actors: [Actor!]!
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "@authorization" must be in a type with "@node"');
    });

    test("should not raise when @authorization is used within the @node directive in type extension", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }

            type Movie @node {
                id: ID!
                title: String
            }

            extend type Movie @authorization(validate: [{ where: { id: "1" } }]) {
                actors: [Actor!]!
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow();
    });

    test("should raise when @authorization is not used within the @node directive on field in type extension", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }

            type Movie {
                id: ID!
                title: String
            }

            extend type Movie {
                actors: [Actor!]! @authorization(validate: [{ where: { id: "1" } }])
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions: {},
                features: {},
            });
        expect(executeValidate).toThrow('Directive "@authorization" must be in a type with "@node"');
    });

    test("should not raise when @authorization is used within the @node directive on field in type extension", () => {
        const doc = gql`
            type Actor @node {
                name: String
            }

            type Movie @node {
                id: ID!
                title: String
            }

            extend type Movie {
                actors: [Actor!]! @authorization(validate: [{ where: { id: "1" } }])
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
        expect(executeValidate).not.toThrow();
    });
});
