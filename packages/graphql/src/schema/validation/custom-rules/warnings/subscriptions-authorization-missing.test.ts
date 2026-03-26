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
    describe("Subscriptions authorization rule", () => {
        test("warns if @authorization is used on type and @subscriptionsAuthorization is missing", () => {
            const doc = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) @node {
                    id: ID!
                    name: String!
                    password: String!
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("warns if @authorization is used on field and @subscriptionsAuthorization is missing", () => {
            const doc = gql`
                type User @node {
                    id: ID!
                    name: String!
                    password: String! @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("does not warn if both directives are used on type", () => {
            const doc = gql`
                type User
                    @node
                    @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                    @subscriptionsAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) {
                    id: ID!
                    name: String!
                    password: String!
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("does not warn if both directives are used on field", () => {
            const doc = gql`
                type User @node {
                    id: ID!
                    name: String!
                    password: String!
                        @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                        @subscriptionsAuthorization(filter: [{ where: { node: { id: "$jwt.sub" } } }])
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: { subscriptions: true },
            });
            expect(warn).toHaveBeenCalled();
        });

        test("does not warn if subscriptions not enabled", () => {
            const doc = gql`
                type User @authorization(filter: [{ where: { node: { id: "$jwt.sub" } } }]) @node {
                    id: ID!
                    name: String!
                    password: String!
                }
            `;

            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });
            expect(warn).toHaveBeenCalled();
        });
    });
});
