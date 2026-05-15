/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7293", () => {
    const testHelper = new TestHelper();

    let Continent: UniqueType;
    let Country: UniqueType;

    beforeEach(async () => {
        Continent = testHelper.createUniqueType("Continent");
        Country = testHelper.createUniqueType("Country");

        const typeDefs = /* GraphQL */ `
            
            type ${Continent}
                @mutation(operations: [CREATE, UPDATE, DELETE])
                @node
                @authorization(
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_CREATE_RELATIONSHIP: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE_RELATIONSHIP]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_DELETE_RELATIONSHIP: { eq: true } } }
                        }
                    ]
                ) {
                _hasAccess_CREATE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
                _hasAccess_DELETE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )

                id: Int! @settable(onCreate: true, onUpdate: false)
            }

            type ${Country}
                @mutation(operations: [CREATE, UPDATE, DELETE])
                @node
                @authorization(
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [CREATE]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [CREATE_RELATIONSHIP]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_CREATE_RELATIONSHIP: { eq: true } } }
                        }
                    ]
                ) {
                _hasAccess_CREATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
                _hasAccess_CREATE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )

                code: String! @settable(onCreate: true, onUpdate: false)
                continent: [${Continent}!]!
                    @relationship(
                        type: "CONTINENT_HAS_COUNTRY"
                        direction: IN
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
                name_en: String!
            }
        
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs, features: { authorization: { key: "secret" } } });
    });

    afterEach(async () => {
        await testHelper.close();
    });
    test("Update with inner connect should not error", async () => {
        await testHelper.executeCypher(`
            CREATE (c:${Country} { code: "DE", name_en: "Germany" })
            CREATE (co:${Continent} { id: 5 })
        `);
        const query = /* GraphQL */ `
            mutation {
                ${Country.operations.update}(
                    where: { code: { eq: "DE" } }
                    update: { continent: [{ connect: { where: { node: { id: { eq: 5 } } } } }] }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
    });

    test("Update with inner disconnect should not error", async () => {
        const query = /* GraphQL */ `
            mutation {
                ${Country.operations.update}(
                    where: { code: { eq: "DE" } }
                    update: { continent: [{ disconnect: { where: { node: { id: { eq: 5 } } } } }] }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
    });

    test("Create with inner connect should not error", async () => {
        await testHelper.executeCypher(`
            CREATE (co:${Continent} { id: 5 })
        `);
        const query = /* GraphQL */ `
            mutation {
                ${Country.operations.create}(
                    input: [
                        { code: "DE", name_en: "test", continent: { connect: { where: { node: { id: { eq: 5 } } } } } }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
    });
});
