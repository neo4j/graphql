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
                type Movie {
                    actors: [Actor!]!
                }

                type Actor {
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
                type Movie {
                    actors: Actor
                }

                type Actor {
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

        test("Relationship", () => {
            const doc = gql`
                type Movie {
                    actors: Actor @relationship(type: "ACTED_IN", direction: OUT)
                }

                type Actor {
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
                type Movie {
                    actors: Actor @cypher(statement: "RETURN 4 AS x", columnName: "x")
                }

                type Actor {
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
                type Movie {
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
