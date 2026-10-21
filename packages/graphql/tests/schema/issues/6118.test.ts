/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { parse, validate } from "graphql";
import { Neo4jGraphQL } from "../../../src";

describe("https://github.com/neo4j/graphql/issues/6118", () => {
    const typeDefs = /* GraphQL */ `
        type Identifier @node {
            value: String!
            identifierType: [IdentifierType!]!
                @relationship(type: "HAS_IDENTIFIER_TYPE", direction: OUT, nestedOperations: [CONNECT, DISCONNECT])
                @settable(onCreate: true, onUpdate: false)
        }

        type IdentifierType @node {
            name: String!
            ofIdentifier: [Identifier!]! @relationship(type: "HAS_IDENTIFIER_TYPE", direction: IN)
        }
    `;

    test("should not allow a nested connect on a relationship that is not settable on update", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const mutation = /* GraphQL */ `
            mutation {
                updateIdentifierTypes(
                    update: {
                        ofIdentifier: [
                            {
                                connect: {
                                    where: { node: { value: { eq: "something" } } }
                                    connect: { identifierType: { where: { node: { name: { eq: "IdentifierType" } } } } }
                                }
                            }
                        ]
                    }
                ) {
                    identifierTypes {
                        name
                    }
                }
            }
        `;

        const errors = validate(schema, parse(mutation));
        expect(errors).not.toHaveLength(0);
    });

    test("should not allow a nested disconnect on a relationship that is not settable on update", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const mutation = /* GraphQL */ `
            mutation {
                updateIdentifierTypes(
                    update: {
                        ofIdentifier: [
                            {
                                disconnect: {
                                    where: { node: { value: { eq: "something" } } }
                                    disconnect: {
                                        identifierType: { where: { node: { name: { eq: "IdentifierType" } } } }
                                    }
                                }
                            }
                        ]
                    }
                ) {
                    identifierTypes {
                        name
                    }
                }
            }
        `;

        const errors = validate(schema, parse(mutation));
        expect(errors).not.toHaveLength(0);
    });

    test("should still allow the nested connect on the settable side", async () => {
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const mutation = /* GraphQL */ `
            mutation {
                updateIdentifierTypes(
                    update: {
                        ofIdentifier: [
                            {
                                connect: { where: { node: { value: { eq: "something" } } } }
                                disconnect: { where: { node: { value: { eq: "other" } } } }
                            }
                        ]
                    }
                ) {
                    identifierTypes {
                        name
                    }
                }
            }
        `;

        const errors = validate(schema, parse(mutation));
        expect(errors).toHaveLength(0);
    });

    test("should not allow a nested connect on an interface target relationship that is not settable on update", async () => {
        const typeDefs = /* GraphQL */ `
            interface Production {
                title: String!
                owner: [Owner!]! @declareRelationship @settable(onUpdate: false)
            }

            type Movie implements Production @node {
                title: String!
                owner: [Owner!]! @relationship(type: "OWNS", direction: IN) @settable(onUpdate: false)
            }

            type Owner @node {
                name: String!
                productions: [Production!]! @relationship(type: "OWNS", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const mutation = /* GraphQL */ `
            mutation {
                updateOwners(
                    update: {
                        productions: [
                            {
                                connect: {
                                    where: { node: { title: { eq: "a" } } }
                                    connect: { owner: { where: { node: { name: { eq: "x" } } } } }
                                }
                            }
                        ]
                    }
                ) {
                    owners {
                        name
                    }
                }
            }
        `;

        const errors = validate(schema, parse(mutation));
        expect(errors).not.toHaveLength(0);
    });

    test("should not allow a nested connect on a union member relationship that is not settable on update", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                owner: [Owner!]! @relationship(type: "OWNS", direction: IN) @settable(onUpdate: false)
            }

            type Series @node {
                title: String!
            }

            union Production = Movie | Series

            type Owner @node {
                name: String!
                productions: [Production!]! @relationship(type: "OWNS", direction: OUT)
            }
        `;
        const neoSchema = new Neo4jGraphQL({ typeDefs });
        const schema = await neoSchema.getSchema();

        const mutation = /* GraphQL */ `
            mutation {
                updateOwners(
                    update: {
                        productions: {
                            Movie: [
                                {
                                    connect: {
                                        where: { node: { title: { eq: "a" } } }
                                        connect: { owner: { where: { node: { name: { eq: "x" } } } } }
                                    }
                                }
                            ]
                        }
                    }
                ) {
                    owners {
                        name
                    }
                }
            }
        `;

        const errors = validate(schema, parse(mutation));
        expect(errors).not.toHaveLength(0);
    });
});
