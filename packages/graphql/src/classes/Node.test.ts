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

import Node, { MutationResponseTypeNames, NodeConstructor, RootTypeFieldNames } from "./Node";
import { ContextBuilder } from "../../tests/utils/builders/context-builder";
import { NodeBuilder } from "../../tests/utils/builders/node-builder";
import { NodeDirective } from "./NodeDirective";

describe("Node", () => {
    const defaultContext = new ContextBuilder().instance();

    test("should construct", () => {
        // @ts-ignore
        const input: NodeConstructor = {
            name: "Movie",
            cypherFields: [],
            enumFields: [],
            primitiveFields: [],
            scalarFields: [],
            temporalFields: [],
            unionFields: [],
            interfaceFields: [],
            objectFields: [],
            interfaces: [],
            otherDirectives: [],
            pointFields: [],
            relationFields: [],
        };

        // @ts-ignore
        expect(new Node(input)).toMatchObject({ name: "Movie" });
    });

    test("should return labelString from node name", () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        expect(node.getLabelString(defaultContext)).toBe(":Movie");
    });

    test("should return labels from node name", () => {
        const node = new NodeBuilder({
            name: "Movie",
        }).instance();

        expect(node.getLabels(defaultContext)).toEqual(["Movie"]);
    });

    describe("root type field names", () => {
        test.each<[string, RootTypeFieldNames]>([
            [
                "Account",
                {
                    create: "createAccounts",
                    read: "accounts",
                    update: "updateAccounts",
                    delete: "deleteAccounts",
                    aggregate: "accountsAggregate",
                },
            ],
            [
                "AWSAccount",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "AWS_ACCOUNT",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "aws-account",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "aws_account",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "account",
                {
                    create: "createAccounts",
                    read: "accounts",
                    update: "updateAccounts",
                    delete: "deleteAccounts",
                    aggregate: "accountsAggregate",
                },
            ],
            [
                "ACCOUNT",
                {
                    create: "createAccounts",
                    read: "accounts",
                    update: "updateAccounts",
                    delete: "deleteAccounts",
                    aggregate: "accountsAggregate",
                },
            ],
            [
                "A",
                {
                    create: "createAs",
                    read: "as",
                    update: "updateAs",
                    delete: "deleteAs",
                    aggregate: "asAggregate",
                },
            ],
            [
                "_2number",
                {
                    create: "create_2Numbers",
                    read: "_2Numbers",
                    update: "update_2Numbers",
                    delete: "delete_2Numbers",
                    aggregate: "_2NumbersAggregate",
                },
            ],
            [
                "__2number",
                {
                    create: "create__2Numbers",
                    read: "__2Numbers",
                    update: "update__2Numbers",
                    delete: "delete__2Numbers",
                    aggregate: "__2NumbersAggregate",
                },
            ],
            [
                "_number",
                {
                    create: "create_numbers",
                    read: "_numbers",
                    update: "update_numbers",
                    delete: "delete_numbers",
                    aggregate: "_numbersAggregate",
                },
            ],
        ])("should pluralize %s as expected", (typename: string, rootTypeFieldNames: RootTypeFieldNames) => {
            const node = new NodeBuilder({
                name: typename,
            }).instance();

            expect(node.rootTypeFieldNames).toStrictEqual(rootTypeFieldNames);
        });

        test.each<[string, RootTypeFieldNames]>([
            [
                "Accounts",
                {
                    create: "createAccounts",
                    read: "accounts",
                    update: "updateAccounts",
                    delete: "deleteAccounts",
                    aggregate: "accountsAggregate",
                },
            ],
            [
                "AWSAccounts",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "AWS_ACCOUNTS",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "aws-accounts",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "aws_accounts",
                {
                    create: "createAwsAccounts",
                    read: "awsAccounts",
                    update: "updateAwsAccounts",
                    delete: "deleteAwsAccounts",
                    aggregate: "awsAccountsAggregate",
                },
            ],
            [
                "accounts",
                {
                    create: "createAccounts",
                    read: "accounts",
                    update: "updateAccounts",
                    delete: "deleteAccounts",
                    aggregate: "accountsAggregate",
                },
            ],
            [
                "ACCOUNTS",
                {
                    create: "createAccounts",
                    read: "accounts",
                    update: "updateAccounts",
                    delete: "deleteAccounts",
                    aggregate: "accountsAggregate",
                },
            ],
        ])(
            "should pluralize %s as expected with plural specified in @node directive",
            (plural: string, rootTypeFieldNames: RootTypeFieldNames) => {
                const node = new NodeBuilder({
                    name: "Test",
                    nodeDirective: new NodeDirective({ plural }),
                }).instance();

                expect(node.rootTypeFieldNames).toStrictEqual(rootTypeFieldNames);
            }
        );
    });

    describe("mutation response type names", () => {
        test.each<[string, MutationResponseTypeNames]>([
            [
                "Account",
                {
                    create: "CreateAccountsMutationResponse",
                    update: "UpdateAccountsMutationResponse",
                },
            ],
            [
                "AWSAccount",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "AWS_ACCOUNT",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "aws-account",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "aws_account",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "account",
                {
                    create: "CreateAccountsMutationResponse",
                    update: "UpdateAccountsMutationResponse",
                },
            ],
            [
                "ACCOUNT",
                {
                    create: "CreateAccountsMutationResponse",
                    update: "UpdateAccountsMutationResponse",
                },
            ],
            [
                "A",
                {
                    create: "CreateAsMutationResponse",
                    update: "UpdateAsMutationResponse",
                },
            ],
            [
                "_2number",
                {
                    create: "Create_2NumbersMutationResponse",
                    update: "Update_2NumbersMutationResponse",
                },
            ],
            [
                "__2number",
                {
                    create: "Create__2NumbersMutationResponse",
                    update: "Update__2NumbersMutationResponse",
                },
            ],
            [
                "_number",
                {
                    create: "Create_numbersMutationResponse",
                    update: "Update_numbersMutationResponse",
                },
            ],
        ])(
            "should generate mutation response type names for %s as expected",
            (typename: string, mutationResponseTypeNames: MutationResponseTypeNames) => {
                const node = new NodeBuilder({
                    name: typename,
                }).instance();

                expect(node.mutationResponseTypeNames).toStrictEqual(mutationResponseTypeNames);
            }
        );

        test.each<[string, MutationResponseTypeNames]>([
            [
                "Accounts",
                {
                    create: "CreateAccountsMutationResponse",
                    update: "UpdateAccountsMutationResponse",
                },
            ],
            [
                "AWSAccounts",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "AWS_ACCOUNTS",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "aws-accounts",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "aws_accounts",
                {
                    create: "CreateAwsAccountsMutationResponse",
                    update: "UpdateAwsAccountsMutationResponse",
                },
            ],
            [
                "accounts",
                {
                    create: "CreateAccountsMutationResponse",
                    update: "UpdateAccountsMutationResponse",
                },
            ],
            [
                "ACCOUNTS",
                {
                    create: "CreateAccountsMutationResponse",
                    update: "UpdateAccountsMutationResponse",
                },
            ],
        ])(
            "should generate mutation response type names for %s as expected with plural specified in @node directive",
            (plural: string, mutationResponseTypeNames: MutationResponseTypeNames) => {
                const node = new NodeBuilder({
                    name: "Test",
                    nodeDirective: new NodeDirective({ plural }),
                }).instance();

                expect(node.mutationResponseTypeNames).toStrictEqual(mutationResponseTypeNames);
            }
        );
    });

    describe("NodeDirective", () => {
        test("should return labels updated with jwt values from Context", () => {
            const node = new NodeBuilder({
                name: "Film",
            })
                .withNodeDirective({
                    label: "$jwt.movielabel",
                })
                .instance();

            const context = new ContextBuilder()
                .with({
                    jwt: {
                        movielabel: "Movie",
                    },
                    myKey: "key",
                })
                .instance();

            const labels = node.getLabels(context);
            const labelString = node.getLabelString(context);

            expect(labels).toEqual(["Movie"]);
            expect(labelString).toBe(":`Movie`");
        });

        test("should return labels updated with context values from Context", () => {
            const node = new NodeBuilder({
                name: "Film",
            })
                .withNodeDirective({
                    label: "$context.myKey",
                })
                .instance();

            const context = new ContextBuilder()
                .with({
                    myKey: "Movie",
                })
                .instance();

            const labels = node.getLabels(context);
            const labelString = node.getLabelString(context);

            expect(labels).toEqual(["Movie"]);
            expect(labelString).toBe(":`Movie`");
        });

        test("should return additional labels updated with jwt values from Context", () => {
            const node = new NodeBuilder({
                name: "Film",
            })
                .withNodeDirective({
                    label: "Film",
                    additionalLabels: ["$jwt.movielabel"],
                })
                .instance();

            const context = new ContextBuilder()
                .with({
                    jwt: {
                        movielabel: "Movie",
                    },
                    myKey: "key",
                })
                .instance();

            const labels = node.getLabels(context);
            const labelString = node.getLabelString(context);

            expect(labels).toEqual(["Film", "Movie"]);
            expect(labelString).toBe(":`Film`:`Movie`");
        });
    });
});
