/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/7293", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Continent
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
                        RETURN "continentCreateRelationship" as result
                        """
                        columnName: "result"
                    )
                _hasAccess_DELETE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN "continentDeleteRelationship" as result
                        """
                        columnName: "result"
                    )

                id: Int! @settable(onCreate: true, onUpdate: false)
            }

            type Country
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
                        RETURN "countryCreate" as result
                        """
                        columnName: "result"
                    )
                _hasAccess_CREATE_RELATIONSHIP: Boolean!
                    @selectable(onRead: false, onAggregate: false)
                    @cypher(
                        statement: """
                        RETURN "countryCreateRelationship" as result
                        """
                        columnName: "result"
                    )

                code: String! @settable(onCreate: true, onUpdate: false)
                continent: [Continent!]!
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

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });
    });

    test("Update with inner connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateCountries(
                    where: { code: { eq: "DE" } }
                    update: { continent: [{ connect: { where: { node: { id: { eq: 5 } } } } }] }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Country)
            WITH *
            WHERE this.code = $param0
            WITH *
            CALL (*) {
              CALL (this) {
                MATCH (this0:Continent)
                CALL (this0) {
                  CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"continentCreateRelationship\\" as result
                  }
                  WITH result AS this1
                  RETURN this1 AS var2
                }
                WITH *
                WHERE this0.id = $param1
                CALL apoc.util.validate(NOT (var2 = $param2), '@neo4j/graphql/FORBIDDEN', [])
                CREATE (this)<-[this3:CONTINENT_HAS_COUNTRY]-(this0)
                WITH *
                CALL (this0) {
                  CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"continentCreateRelationship\\" as result
                  }
                  WITH result AS this4
                  RETURN this4 AS var5
                }
                CALL (this0) {
                  CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"countryCreateRelationship\\" as result
                  }
                  WITH result AS this6
                  RETURN this6 AS var7
                }
                WITH *
                CALL apoc.util.validate(NOT (var5 = $param3), '@neo4j/graphql/FORBIDDEN', [])
                WITH *
                CALL apoc.util.validate(NOT (var7 = $param4), '@neo4j/graphql/FORBIDDEN', [])
              }
            }
            FINISH"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"DE\\",
                \\"param1\\": {
                    \\"low\\": 5,
                    \\"high\\": 0
                },
                \\"param2\\": true,
                \\"param3\\": true,
                \\"param4\\": true
            }"
        `);
    });

    test("Update with inner disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateCountries(
                    where: { code: { eq: "DE" } }
                    update: { continent: [{ disconnect: { where: { node: { id: { eq: 5 } } } } }] }
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Country)
            WITH *
            WHERE this.code = $param0
            WITH *
            CALL (*) {
              CALL (this) {
                OPTIONAL MATCH (this)<-[this0:CONTINENT_HAS_COUNTRY]-(this1:Continent)
                CALL (this1) {
                  CALL (this1) {
                    WITH this1 AS this
                    RETURN \\"continentDeleteRelationship\\" as result
                  }
                  WITH result AS this2
                  RETURN this2 AS var3
                }
                WITH *
                WHERE this1.id = $param1
                CALL apoc.util.validate(NOT (var3 = $param2), '@neo4j/graphql/FORBIDDEN', [])
                WITH *
                DELETE this0
                WITH *
                CALL (this1) {
                  CALL (this1) {
                    WITH this1 AS this
                    RETURN \\"continentDeleteRelationship\\" as result
                  }
                  WITH result AS this4
                  RETURN this4 AS var5
                }
                WITH *
                CALL apoc.util.validate(NOT (var5 = $param3), '@neo4j/graphql/FORBIDDEN', [])
              }
            }
            FINISH"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"DE\\",
                \\"param1\\": {
                    \\"low\\": 5,
                    \\"high\\": 0
                },
                \\"param2\\": true,
                \\"param3\\": true
            }"
        `);
    });

    test("Create with inner connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                createCountries(
                    input: [
                        { code: "DE", name_en: "test", continent: { connect: { where: { node: { id: { eq: 1 } } } } } }
                    ]
                ) {
                    info {
                        nodesCreated
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              CREATE (this0:Country)
              SET
                this0.code = $param0,
                this0.name_en = $param1
              WITH *
              CALL (this0) {
                MATCH (this1:Continent)
                CALL (this1) {
                  CALL (this1) {
                    WITH this1 AS this
                    RETURN \\"continentCreateRelationship\\" as result
                  }
                  WITH result AS this2
                  RETURN this2 AS var3
                }
                WITH *
                WHERE this1.id = $param2
                CALL apoc.util.validate(NOT (var3 = $param3), '@neo4j/graphql/FORBIDDEN', [])
                CREATE (this0)<-[this4:CONTINENT_HAS_COUNTRY]-(this1)
                WITH *
                CALL (this1) {
                  CALL (this1) {
                    WITH this1 AS this
                    RETURN \\"continentCreateRelationship\\" as result
                  }
                  WITH result AS this5
                  RETURN this5 AS var6
                }
                CALL (this1) {
                  CALL (this1) {
                    WITH this1 AS this
                    RETURN \\"countryCreateRelationship\\" as result
                  }
                  WITH result AS this7
                  RETURN this7 AS var8
                }
                WITH *
                CALL apoc.util.validate(NOT (var6 = $param4), '@neo4j/graphql/FORBIDDEN', [])
                WITH *
                CALL apoc.util.validate(NOT (var8 = $param5), '@neo4j/graphql/FORBIDDEN', [])
              }
              WITH *
              CALL (*) {
                CALL (*) {
                  CALL (this0) {
                    WITH this0 AS this
                    RETURN \\"countryCreate\\" as result
                  }
                  WITH result AS this9
                  RETURN this9 AS var10
                }
                CALL apoc.util.validate(NOT (var10 = $param6), '@neo4j/graphql/FORBIDDEN', [])
              }
              RETURN this0 AS this
            }
            FINISH"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"DE\\",
                \\"param1\\": \\"test\\",
                \\"param2\\": {
                    \\"low\\": 1,
                    \\"high\\": 0
                },
                \\"param3\\": true,
                \\"param4\\": true,
                \\"param5\\": true,
                \\"param6\\": true
            }"
        `);
    });
});
