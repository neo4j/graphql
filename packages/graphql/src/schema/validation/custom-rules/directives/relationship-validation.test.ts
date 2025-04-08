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
import { getError, NoErrorThrownError } from "../../../../../tests/utils/get-error";
import validateDocument from "../../validate-document";

const additionalDefinitions = {
    enums: [] as EnumTypeDefinitionNode[],
    interfaces: [] as InterfaceTypeDefinitionNode[],
    unions: [] as UnionTypeDefinitionNode[],
    objects: [] as ObjectTypeDefinitionNode[],
};

describe("@relationship validation", () => {
    test("@relationship can't be used with a non-node target", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                name: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty(
            "message",
            'Invalid directive usage: Directive @relationship should be a type with "@node".'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "someActors", "@relationship"]);
    });

    test("@relationship can be used with a target that is extended with node", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                name: String
            }

            extend type Actor @node {
                test: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toBeInstanceOf(NoErrorThrownError);
    });

    test("@relationship can't be used with a non-node interface", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Person!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            interface Person {
                name: String
            }

            type Actor implements Person {
                name: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty(
            "message",
            'Invalid directive usage: Directive @relationship should be an interface implemented by a type with "@node".'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "someActors", "@relationship"]);
    });

    test("@relationship can be used with a node interface", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Person!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            interface Person {
                name: String
            }

            type Actor implements Person @node {
                name: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toBeInstanceOf(NoErrorThrownError);
    });

    test("@relationship can't be used with a non-node union", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Person!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Person = Actor

            type Actor {
                name: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty(
            "message",
            'Invalid directive usage: Directive @relationship to an union should have all its types with "@node".'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "someActors", "@relationship"]);
    });

    test("@relationship can be used with a node union", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Person!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Person = Actor

            type Actor @node {
                name: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toBeInstanceOf(NoErrorThrownError);
    });
});
