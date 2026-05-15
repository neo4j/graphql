/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7293 full type defs", () => {
    const testHelper = new TestHelper();

    let Continent: UniqueType;
    let Country: UniqueType;
    let Company: UniqueType;
    let Triad: UniqueType;

    beforeEach(async () => {
        Continent = testHelper.createUniqueType("Continent");
        Country = testHelper.createUniqueType("Country");
        Company = testHelper.createUniqueType("Company");
        Triad = testHelper.createUniqueType("Triad");

        const typeDefs = /* GraphQL */ `
            type ${Company}
                @mutation(operations: [DELETE, CREATE, UPDATE])
                @node
                @subscription(events: [])
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: { node: { _hasAccess_READ: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: { node: { _hasAccess_AGGREGATE: { eq: true } } }
                        }
                    ]
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [CREATE]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_UPDATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            when: [BEFORE]
                            where: { node: { _hasAccess_DELETE: { eq: true } } }
                        }
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
                _hasAccess_AGGREGATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
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
                _hasAccess_DELETE: Boolean!
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
                _hasAccess_READ: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
                _hasAccess_UPDATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )

                id: Int! @settable(onCreate: true, onUpdate: false)
            }

            type ${Continent}
                @mutation(operations: [CREATE, UPDATE, DELETE])
                @node
                @subscription(events: [])
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: { node: { _hasAccess_READ: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: { node: { _hasAccess_AGGREGATE: { eq: true } } }
                        }
                    ]
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [CREATE]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_UPDATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            when: [BEFORE]
                            where: { node: { _hasAccess_DELETE: { eq: true } } }
                        }
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
                _hasAccess_AGGREGATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
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
                _hasAccess_DELETE: Boolean!
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
                _hasAccess_READ: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
                _hasAccess_UPDATE: Boolean!
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
                @subscription(events: [])
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: { node: { _hasAccess_READ: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: { node: { _hasAccess_AGGREGATE: { eq: true } } }
                        }
                    ]
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [CREATE]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_UPDATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            when: [BEFORE]
                            where: { node: { _hasAccess_DELETE: { eq: true } } }
                        }
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
                _hasAccess_AGGREGATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
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
                _hasAccess_DELETE: Boolean!
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
                _hasAccess_READ: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
                _hasAccess_UPDATE: Boolean!
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
                responsibleCompanies: [${Company}!]!
                    @relationship(
                        type: "COMPANY_IS_RESPONSIBLE_FOR_COUNTRY"
                        direction: IN
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
                triad: [${Triad}!]!
                    @relationship(
                        type: "COUNTRY_IS_IN_TRIAD"
                        direction: OUT
                        nestedOperations: [CREATE, UPDATE, DELETE, CONNECT, DISCONNECT]
                        queryDirection: DIRECTED
                    )
                    @settable(onCreate: true, onUpdate: true)
            }

            type ${Triad}
                @mutation(operations: [CREATE, UPDATE, DELETE])
                @node
                @subscription(events: [])
                @authorization(
                    filter: [
                        {
                            requireAuthentication: false
                            operations: [READ]
                            where: { node: { _hasAccess_READ: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [AGGREGATE]
                            where: { node: { _hasAccess_AGGREGATE: { eq: true } } }
                        }
                    ]
                    validate: [
                        {
                            requireAuthentication: false
                            operations: [CREATE]
                            when: [AFTER]
                            where: { node: { _hasAccess_CREATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [UPDATE]
                            when: [BEFORE, AFTER]
                            where: { node: { _hasAccess_UPDATE: { eq: true } } }
                        }
                        {
                            requireAuthentication: false
                            operations: [DELETE]
                            when: [BEFORE]
                            where: { node: { _hasAccess_DELETE: { eq: true } } }
                        }
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
                _hasAccess_AGGREGATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
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
                _hasAccess_DELETE: Boolean!
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
                _hasAccess_READ: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )
                _hasAccess_UPDATE: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN true as result
                        """
                        columnName: "result"
                    )

                id: Int! @settable(onCreate: true, onUpdate: false)
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
