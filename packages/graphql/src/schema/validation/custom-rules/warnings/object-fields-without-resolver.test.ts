/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type {
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import { gql } from "graphql-tag";
import validateDocument from "../../validate-document";

const additionalDefinitions = {
    enums: [] as EnumTypeDefinitionNode[],
    interfaces: [] as InterfaceTypeDefinitionNode[],
    unions: [] as UnionTypeDefinitionNode[],
    objects: [] as ObjectTypeDefinitionNode[],
};

describe("WarnObjectFieldsWithoutResolver", () => {
    let warn: jest.SpyInstance;

    beforeEach(() => {
        warn = jest.spyOn(console, "warn").mockImplementation(() => {});
    });

    afterEach(() => {
        warn.mockReset();
    });
    describe("Does not show warning", () => {
        test("Error on object field array  without resolver throw warning in debug", () => {
            const doc = gql`
                type Movie @node {
                    actors: [Actor!]!
                }

                type Actor @node {
                    name: String
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
            expect(warn).not.toHaveBeenCalled();
        });

        test("Error on object field without resolver throw warning in debug", () => {
            const doc = gql`
                type Movie @node {
                    actors: Actor
                }

                type Actor @node {
                    name: String
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
            expect(warn).not.toHaveBeenCalled();
        });

        test("Custom Cypher", () => {
            const doc = gql`
                type Movie @node {
                    actors: Actor @cypher(statement: "RETURN 4 AS x", columnName: "x")
                }

                type Actor @node {
                    name: String
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
            expect(warn).not.toHaveBeenCalled();
        });

        test("enum", () => {
            const doc = gql`
                type Movie @node {
                    actors: Actor
                }

                enum Actor {
                    KEANU
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
            expect(warn).not.toHaveBeenCalled();
        });
    });
});
