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

describe("Object types validation", () => {
    test("interfaces cannot be partially nodes", () => {
        const doc = gql`
            interface Person {
                name: String
            }

            type Director implements Person {
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
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty("message", "Interface needs to be fully implemented by `@node` types.");
    });

    test("interfaces can be either fully implemented by nodes or not", () => {
        const doc = gql`
            interface Person {
                name: String
            }

            interface Production {
                title: String
            }

            type Director implements Person @node {
                name: String
            }

            type Actor implements Person @node {
                name: String
            }

            type Movie implements Production {
                title: String
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

    test("interfaces cannot be partially implemented by nodes with extends", () => {
        const doc = gql`
            interface Person {
                name: String
            }

            type Director implements Person {
                name: String
            }

            type Actor implements Person {
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
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty("message", "Interface needs to be fully implemented by `@node` types.");
    });

    test("interfaces cannot be partially nodes with extends", () => {
        const doc = gql`
            interface Person {
                name: String
            }

            type Director implements Person {
                name: String
            }

            type Actor @node {
                name: String
            }

            extend type Actor implements Person {
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
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty("message", "Interface needs to be fully implemented by `@node` types.");
    });
});
