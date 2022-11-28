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

import type { MutationResponseTypeNames, NodeConstructor, RootTypeFieldNames, SubscriptionEvents } from "./Node";
import Node from "./Node";
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
                    subscribe: {
                        created: "accountCreated",
                        updated: "accountUpdated",
                        deleted: "accountDeleted",
                        connected: "accountRelationshipCreated",
                        disconnected: "accountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "awsAccountCreated",
                        updated: "awsAccountUpdated",
                        deleted: "awsAccountDeleted",
                        connected: "awsAccountRelationshipCreated",
                        disconnected: "awsAccountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "awsAccountCreated",
                        updated: "awsAccountUpdated",
                        deleted: "awsAccountDeleted",
                        connected: "awsAccountRelationshipCreated",
                        disconnected: "awsAccountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "awsAccountCreated",
                        updated: "awsAccountUpdated",
                        deleted: "awsAccountDeleted",
                        connected: "awsAccountRelationshipCreated",
                        disconnected: "awsAccountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "awsAccountCreated",
                        updated: "awsAccountUpdated",
                        deleted: "awsAccountDeleted",
                        connected: "awsAccountRelationshipCreated",
                        disconnected: "awsAccountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "accountCreated",
                        updated: "accountUpdated",
                        deleted: "accountDeleted",
                        connected: "accountRelationshipCreated",
                        disconnected: "accountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "accountCreated",
                        updated: "accountUpdated",
                        deleted: "accountDeleted",
                        connected: "accountRelationshipCreated",
                        disconnected: "accountRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "aCreated",
                        updated: "aUpdated",
                        deleted: "aDeleted",
                        connected: "aRelationshipCreated",
                        disconnected: "aRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "_2NumberCreated",
                        updated: "_2NumberUpdated",
                        deleted: "_2NumberDeleted",
                        connected: "_2NumberRelationshipCreated",
                        disconnected: "_2NumberRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "__2NumberCreated",
                        updated: "__2NumberUpdated",
                        deleted: "__2NumberDeleted",
                        connected: "__2NumberRelationshipCreated",
                        disconnected: "__2NumberRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "_numberCreated",
                        updated: "_numberUpdated",
                        deleted: "_numberDeleted",
                        connected: "_numberRelationshipCreated",
                        disconnected: "_numberRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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
                    subscribe: {
                        created: "testCreated",
                        updated: "testUpdated",
                        deleted: "testDeleted",
                        connected: "testRelationshipCreated",
                        disconnected: "testRelationshipDeleted",
                    },
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

    describe("Subscription event type names", () => {
        test.each<[string, SubscriptionEvents]>([
            [
                "Account",
                {
                    create: "AccountCreatedEvent",
                    update: "AccountUpdatedEvent",
                    delete: "AccountDeletedEvent",
                    connect: "AccountRelationshipCreatedEvent",
                    disconnect: "AccountRelationshipDeletedEvent",
                },
            ],
            [
                "AWSAccount",
                {
                    create: "AwsAccountCreatedEvent",
                    update: "AwsAccountUpdatedEvent",
                    delete: "AwsAccountDeletedEvent",
                    connect: "AwsAccountRelationshipCreatedEvent",
                    disconnect: "AwsAccountRelationshipDeletedEvent",
                },
            ],
            [
                "AWS_ACCOUNT",
                {
                    create: "AwsAccountCreatedEvent",
                    update: "AwsAccountUpdatedEvent",
                    delete: "AwsAccountDeletedEvent",
                    connect: "AwsAccountRelationshipCreatedEvent",
                    disconnect: "AwsAccountRelationshipDeletedEvent",
                },
            ],
            [
                "aws-account",
                {
                    create: "AwsAccountCreatedEvent",
                    update: "AwsAccountUpdatedEvent",
                    delete: "AwsAccountDeletedEvent",
                    connect: "AwsAccountRelationshipCreatedEvent",
                    disconnect: "AwsAccountRelationshipDeletedEvent",
                },
            ],
            [
                "aws_account",
                {
                    create: "AwsAccountCreatedEvent",
                    update: "AwsAccountUpdatedEvent",
                    delete: "AwsAccountDeletedEvent",
                    connect: "AwsAccountRelationshipCreatedEvent",
                    disconnect: "AwsAccountRelationshipDeletedEvent",
                },
            ],
            [
                "account",
                {
                    create: "AccountCreatedEvent",
                    update: "AccountUpdatedEvent",
                    delete: "AccountDeletedEvent",
                    connect: "AccountRelationshipCreatedEvent",
                    disconnect: "AccountRelationshipDeletedEvent",
                },
            ],
            [
                "ACCOUNT",
                {
                    create: "AccountCreatedEvent",
                    update: "AccountUpdatedEvent",
                    delete: "AccountDeletedEvent",
                    connect: "AccountRelationshipCreatedEvent",
                    disconnect: "AccountRelationshipDeletedEvent",
                },
            ],
            [
                "A",
                {
                    create: "ACreatedEvent",
                    update: "AUpdatedEvent",
                    delete: "ADeletedEvent",
                    connect: "ARelationshipCreatedEvent",
                    disconnect: "ARelationshipDeletedEvent",
                },
            ],
            [
                "_2number",
                {
                    create: "_2NumberCreatedEvent",
                    update: "_2NumberUpdatedEvent",
                    delete: "_2NumberDeletedEvent",
                    connect: "_2NumberRelationshipCreatedEvent",
                    disconnect: "_2NumberRelationshipDeletedEvent",
                },
            ],
            [
                "__2number",
                {
                    create: "__2NumberCreatedEvent",
                    update: "__2NumberUpdatedEvent",
                    delete: "__2NumberDeletedEvent",
                    connect: "__2NumberRelationshipCreatedEvent",
                    disconnect: "__2NumberRelationshipDeletedEvent",
                },
            ],
            [
                "_number",
                {
                    create: "_numberCreatedEvent",
                    update: "_numberUpdatedEvent",
                    delete: "_numberDeletedEvent",
                    connect: "_numberRelationshipCreatedEvent",
                    disconnect: "_numberRelationshipDeletedEvent",
                },
            ],
        ])(
            "should generate Subscription event type names for %s as expected",
            (typename: string, subscriptionEventTypeNames: SubscriptionEvents) => {
                const node = new NodeBuilder({
                    name: typename,
                }).instance();

                expect(node.subscriptionEventTypeNames).toStrictEqual(subscriptionEventTypeNames);
            }
        );
    });

    describe("Subscription event payload field names", () => {
        test.each<[string, SubscriptionEvents]>([
            [
                "Account",
                {
                    create: "createdAccount",
                    update: "updatedAccount",
                    delete: "deletedAccount",
                    connect: "account",
                    disconnect: "account",
                },
            ],
            [
                "AWSAccount",
                {
                    create: "createdAwsAccount",
                    update: "updatedAwsAccount",
                    delete: "deletedAwsAccount",
                    connect: "awsAccount",
                    disconnect: "awsAccount",
                },
            ],
            [
                "AWS_ACCOUNT",
                {
                    create: "createdAwsAccount",
                    update: "updatedAwsAccount",
                    delete: "deletedAwsAccount",
                    connect: "awsAccount",
                    disconnect: "awsAccount",
                },
            ],
            [
                "aws-account",
                {
                    create: "createdAwsAccount",
                    update: "updatedAwsAccount",
                    delete: "deletedAwsAccount",
                    connect: "awsAccount",
                    disconnect: "awsAccount",
                },
            ],
            [
                "aws_account",
                {
                    create: "createdAwsAccount",
                    update: "updatedAwsAccount",
                    delete: "deletedAwsAccount",
                    connect: "awsAccount",
                    disconnect: "awsAccount",
                },
            ],
            [
                "account",
                {
                    create: "createdAccount",
                    update: "updatedAccount",
                    delete: "deletedAccount",
                    connect: "account",
                    disconnect: "account",
                },
            ],
            [
                "ACCOUNT",
                {
                    create: "createdAccount",
                    update: "updatedAccount",
                    delete: "deletedAccount",
                    connect: "account",
                    disconnect: "account",
                },
            ],
            [
                "A",
                {
                    create: "createdA",
                    update: "updatedA",
                    delete: "deletedA",
                    connect: "a",
                    disconnect: "a",
                },
            ],
            [
                "_2number",
                {
                    create: "created_2Number",
                    update: "updated_2Number",
                    delete: "deleted_2Number",
                    connect: "_2Number",
                    disconnect: "_2Number",
                },
            ],
            [
                "__2number",
                {
                    create: "created__2Number",
                    update: "updated__2Number",
                    delete: "deleted__2Number",
                    connect: "__2Number",
                    disconnect: "__2Number",
                },
            ],
            [
                "_number",
                {
                    create: "created_number",
                    update: "updated_number",
                    delete: "deleted_number",
                    connect: "_number",
                    disconnect: "_number",
                },
            ],
        ])(
            "should generate Subscription event type names for %s as expected",
            (typename: string, subscriptionEventPayloadFieldNames: SubscriptionEvents) => {
                const node = new NodeBuilder({
                    name: typename,
                }).instance();

                expect(node.subscriptionEventPayloadFieldNames).toStrictEqual(subscriptionEventPayloadFieldNames);
            }
        );
    });

    describe("global node resolution", () => {
        test("should return true if it is a global node", () => {
            const node = new NodeBuilder({
                name: "Film",
                primitiveFields: [],
                isGlobalNode: true,
                globalIdField: "dbId",
            }).instance();

            const isGlobalNode = node.isGlobalNode;
            expect(isGlobalNode).toBe(true);
        });

        test("should convert the db id to a global relay id with the correct typename", () => {
            const node = new NodeBuilder({
                name: "Film",
                primitiveFields: [],
                isGlobalNode: true,
                globalIdField: "title",
            }).instance();

            const value = "the Matrix";

            const relayId = node.toGlobalId(value);

            expect(relayId).toBe("RmlsbTp0aXRsZTp0aGUgTWF0cml4");

            expect(node.fromGlobalId(relayId)).toEqual({
                typeName: "Film",
                field: "title",
                id: value,
            });
        });
        test("should properly convert a relay id to an object when the id has a colon in the name", () => {
            const node = new NodeBuilder({
                name: "Film",
                primitiveFields: [],
                isGlobalNode: true,
                globalIdField: "title",
            }).instance();

            const value = "2001: A Space Odyssey";

            const relayId = node.toGlobalId(value);

            expect(node.fromGlobalId(relayId)).toMatchObject({ field: "title", typeName: "Film", id: value });
        });
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
