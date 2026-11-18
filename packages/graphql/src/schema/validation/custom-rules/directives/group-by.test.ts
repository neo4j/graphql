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
import gql from "graphql-tag";
import { getError, NoErrorThrownError } from "../../../../../tests/utils/get-error";
import validateDocument from "../../validate-document";

const additionalDefinitions = {
    enums: [] as EnumTypeDefinitionNode[],
    interfaces: [] as InterfaceTypeDefinitionNode[],
    unions: [] as UnionTypeDefinitionNode[],
    objects: [] as ObjectTypeDefinitionNode[],
};

describe("@groupBy validation", () => {
    test("@groupBy can't be used in a non-node type", () => {
        const doc = gql`
            type Movie {
                year: Int! @groupBy
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
            'Invalid directive usage: Directive "@groupBy" should be in a type with "@node"'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "year", "@groupBy"]);
    });

    test("@groupBy can't be used on interface type", () => {
        const doc = gql`
            type Movie implements Production @node {
                year: Int!
            }
            interface Production {
                year: Int! @groupBy
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
            'Invalid directive usage: Directive "@groupBy" should be in a type with "@node"'
        );
        expect(errors[0]).toHaveProperty("path", ["Production", "year", "@groupBy"]);
    });

    test("@groupBy can't be used with a type field", () => {
        const doc = gql`
            type Movie @node {
                year: AnotherType! @groupBy
            }

            type AnotherType {
                text: String!
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
            'Invalid directive usage: Directive "@groupBy" can only be applied to primitive fields'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "year", "@groupBy"]);
    });

    test("@groupBy can't be used with a nullable list field", () => {
        const doc = gql`
            type Movie @node {
                year: [Int!]! @groupBy
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
            'Invalid directive usage: Directive "@groupBy" cannot be applied to lists'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "year", "@groupBy"]);
    });

    test("@groupBy can't be used with a non-null list field", () => {
        const doc = gql`
            type Movie @node {
                year: [Int!] @groupBy
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
            'Invalid directive usage: Directive "@groupBy" cannot be applied to lists'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "year", "@groupBy"]);
    });

    test("@groupBy can't be used with enum", () => {
        const doc = gql`
            enum MovieType {
                HORROR
                COMEDY
            }

            type Movie @node {
                year: MovieType @groupBy
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
            'Invalid directive usage: Directive "@groupBy" can only be applied to primitive fields'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "year", "@groupBy"]);
    });
});
