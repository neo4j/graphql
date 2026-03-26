/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError, GraphQLSchema } from "graphql";
import { gql } from "graphql-tag";
import { Neo4jGraphQL } from "../../../src";

describe("schema/rfc/003", () => {
    const msg = `Invalid field type: List type relationship fields must be non-nullable and have non-nullable entries, please change type to [Target!]!`;

    describe("ObjectType", () => {
        test("should not throw when using valid relationship", async () => {
            const typeDefs = gql`
                type Source @node {
                    targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }

                type SecondTarget @node {
                    id: ID @id
                }

                type ThirdTarget @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).resolves.toBeInstanceOf(GraphQLSchema);
        });

        test("If there are no relationships, then should always be empty array and not null", async () => {
            const typeDefs = gql`
                type Source @node {
                    targets: [Target!] @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([new GraphQLError(msg)]);
        });

        test("This suggests a relationship with no target node", async () => {
            const typeDefs = gql`
                type Source @node {
                    targets: [Target]! @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });
            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([new GraphQLError(msg)]);
        });

        test("should throw when ListType and not NonNullNamedType inside it", async () => {
            const typeDefs = gql`
                type Source @node {
                    targets: [Target] @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([new GraphQLError(msg)]);
        });
    });

    describe("InterfaceType", () => {
        test("should not throw when using valid relationship", async () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target!]! @declareRelationship
                }

                type Source implements SourceInterface @node {
                    id: ID @id
                    targets: [Target!]! @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).resolves.toBeInstanceOf(GraphQLSchema);
        });

        test("If there are no relationships, then should always be empty array and not null", async () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target!] @declareRelationship
                }

                type Source implements SourceInterface @node {
                    id: ID @id
                    targets: [Target!] @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError(msg),
                new GraphQLError(msg),
            ]);
        });

        test("This suggests a relationship with no target node", async () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target]! @declareRelationship
                }

                type Source implements SourceInterface @node {
                    id: ID @id
                    targets: [Target]! @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError(msg),
                new GraphQLError(msg),
            ]);
        });

        test("should throw when ListType and not NonNullNamedType inside it", async () => {
            const typeDefs = gql`
                interface SourceInterface {
                    targets: [Target] @declareRelationship
                }

                type Source implements SourceInterface @node {
                    id: ID @id
                    targets: [Target] @relationship(type: "HAS_TARGET", direction: OUT)
                }

                type Target @node {
                    id: ID @id
                }
            `;

            const neoSchema = new Neo4jGraphQL({ typeDefs });

            await expect(neoSchema.getSchema()).rejects.toIncludeSameMembers([
                new GraphQLError(msg),
                new GraphQLError(msg),
            ]);
        });
    });
});
