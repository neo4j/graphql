/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../../src";
import { formatCypher, formatParams, translateQuery } from "../../utils/tck-test-utils";

describe("1-many relationships with Interfaces and declared relationships", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            interface Actor {
                name: String!
                actedIn: Production @declareRelationship
                directed: [Production!]! @declareRelationship
            }
            interface Production {
                title: String!
                actor: [Actor!]! @declareRelationship
                director: Person @declareRelationship
            }

            type Movie implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedInMovie")
                director: Person @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type Series implements Production @node {
                title: String!
                actor: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedInSeries")
                director: Person @relationship(type: "DIRECTED", direction: IN, properties: "Directed")
            }

            type Dog implements Actor @node {
                name: String!
                actedIn: Production @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInMovie")
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type Person implements Actor @node {
                name: String!
                actedIn: Production @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedInSeries")
                directed: [Production!]! @relationship(type: "DIRECTED", direction: OUT, properties: "Directed")
            }

            type ActedInMovie @relationshipProperties {
                screenTime: Int
            }

            type ActedInSeries @relationshipProperties {
                episodes: Int
            }

            type Directed @relationshipProperties {
                year: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("create single declared relationship", async () => {
        const query = `
            mutation {
               createPeople(input: [{ 
                    name: "Keanu", 
                    actedIn: { 
                        create: { 
                            node: { 
                                Movie: { 
                                    title: "The Matrix", 
                                    director: { 
                                        create: { 
                                            node: { name: "Director" }, 
                                            edge: { year: 1999 } 
                                        } 
                                    } 
                                } 
                            }, 
                            edge: { episodes: 10 } 
                        } 
                    }
                }]) {
                    people {
                        name
                    }
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL {
              CREATE (this0:Person)
              SET this0.name = $param0
              WITH *
              CREATE (this1:Movie)
              MERGE (this0)-[this2:ACTED_IN]->(this1)
              SET
                this1.title = $param1,
                this2.episodes = $param2
              WITH *
              CREATE (this3:Person)
              MERGE (this1)<-[this4:DIRECTED]-(this3)
              SET
                this3.name = $param3,
                this4.year = $param4
              RETURN this0 AS this
            }
            WITH this
            CALL (this) {
              RETURN this { .name } AS var5
            }
            RETURN collect(var5) AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Keanu\\",
                \\"param1\\": \\"The Matrix\\",
                \\"param2\\": {
                    \\"low\\": 10,
                    \\"high\\": 0
                },
                \\"param3\\": \\"Director\\",
                \\"param4\\": {
                    \\"low\\": 1999,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("delete single declared relationship", async () => {
        const query = `
            mutation {
              deletePeople(where: { name: { eq: "Director" } }, delete: { actedIn: { delete: { director: { where: { node: { name: { eq: "K" } } } } } } }) {
                    nodesDeleted
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Person)
            WHERE this.name = $param0
            WITH *
            CALL (*) {
              OPTIONAL MATCH (this)-[this0:ACTED_IN]->(this1:Movie)
              WITH *
              CALL (*) {
                OPTIONAL MATCH (this1)<-[this2:DIRECTED]-(this3:Person)
                WHERE this3.name = $param1
                WITH this2, collect(DISTINCT this3) AS var4
                CALL (var4) {
                  UNWIND var4 AS var5
                  DETACH DELETE var5
                }
              }
              WITH this0, collect(DISTINCT this1) AS var6
              CALL (var6) {
                UNWIND var6 AS var7
                DETACH DELETE var7
              }
            }
            CALL (*) {
              OPTIONAL MATCH (this)-[this8:ACTED_IN]->(this9:Series)
              WITH *
              CALL (*) {
                OPTIONAL MATCH (this9)<-[this10:DIRECTED]-(this11:Person)
                WHERE this11.name = $param2
                WITH this10, collect(DISTINCT this11) AS var12
                CALL (var12) {
                  UNWIND var12 AS var13
                  DETACH DELETE var13
                }
              }
              WITH this8, collect(DISTINCT this9) AS var14
              CALL (var14) {
                UNWIND var14 AS var15
                DETACH DELETE var15
              }
            }
            WITH *
            DETACH DELETE this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Director\\",
                \\"param1\\": \\"K\\",
                \\"param2\\": \\"K\\"
            }"
        `);
    });

    test("returns all fields", async () => {
        const query = `
            query {
              productions {
                    actor {
                        name
                        actedIn {
                            title
                        }
                    }
                    director {
                       name
                       directed {
                            title
                       }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
              MATCH (this0:Movie)
              CALL (this0) {
                CALL (*) {
                  WITH *
                  MATCH (this0)<-[this1:ACTED_IN]-(this2:Dog)
                  CALL (this2) {
                    CALL (*) {
                      WITH *
                      MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                      WITH this4 { .title, __resolveType: 'Movie', __id: elementId(this4) } AS var5
                      RETURN var5
                      UNION
                      WITH *
                      MATCH (this2)-[this6:ACTED_IN]->(this7:Series)
                      WITH this7 { .title, __resolveType: 'Series', __id: elementId(this7) } AS var5
                      RETURN var5
                    }
                    WITH var5
                    RETURN head(collect(var5)) AS var5
                  }
                  WITH this2 { .name, actedIn: var5, __resolveType: 'Dog', __id: elementId(this2) } AS var8
                  RETURN var8
                  UNION
                  WITH *
                  MATCH (this0)<-[this9:ACTED_IN]-(this10:Person)
                  CALL (this10) {
                    CALL (*) {
                      WITH *
                      MATCH (this10)-[this11:ACTED_IN]->(this12:Movie)
                      WITH this12 { .title, __resolveType: 'Movie', __id: elementId(this12) } AS var13
                      RETURN var13
                      UNION
                      WITH *
                      MATCH (this10)-[this14:ACTED_IN]->(this15:Series)
                      WITH this15 { .title, __resolveType: 'Series', __id: elementId(this15) } AS var13
                      RETURN var13
                    }
                    WITH var13
                    RETURN head(collect(var13)) AS var13
                  }
                  WITH this10 { .name, actedIn: var13, __resolveType: 'Person', __id: elementId(this10) } AS var8
                  RETURN var8
                }
                WITH var8
                RETURN collect(var8) AS var8
              }
              CALL (this0) {
                MATCH (this0)<-[this16:DIRECTED]-(this17:Person)
                WITH DISTINCT this17
                CALL (this17) {
                  CALL (*) {
                    WITH *
                    MATCH (this17)-[this18:DIRECTED]->(this19:Movie)
                    WITH this19 { .title, __resolveType: 'Movie', __id: elementId(this19) } AS var20
                    RETURN var20
                    UNION
                    WITH *
                    MATCH (this17)-[this21:DIRECTED]->(this22:Series)
                    WITH this22 { .title, __resolveType: 'Series', __id: elementId(this22) } AS var20
                    RETURN var20
                  }
                  WITH var20
                  RETURN collect(var20) AS var20
                }
                WITH this17 { .name, directed: var20 } AS this17
                RETURN head(collect(this17)) AS var23
              }
              WITH this0 { actor: var8, director: var23, __resolveType: 'Movie', __id: elementId(this0) } AS this
              RETURN this
              UNION
              MATCH (this24:Series)
              CALL (this24) {
                CALL (*) {
                  WITH *
                  MATCH (this24)<-[this25:ACTED_IN]-(this26:Dog)
                  CALL (this26) {
                    CALL (*) {
                      WITH *
                      MATCH (this26)-[this27:ACTED_IN]->(this28:Movie)
                      WITH this28 { .title, __resolveType: 'Movie', __id: elementId(this28) } AS var29
                      RETURN var29
                      UNION
                      WITH *
                      MATCH (this26)-[this30:ACTED_IN]->(this31:Series)
                      WITH this31 { .title, __resolveType: 'Series', __id: elementId(this31) } AS var29
                      RETURN var29
                    }
                    WITH var29
                    RETURN head(collect(var29)) AS var29
                  }
                  WITH this26 { .name, actedIn: var29, __resolveType: 'Dog', __id: elementId(this26) } AS var32
                  RETURN var32
                  UNION
                  WITH *
                  MATCH (this24)<-[this33:ACTED_IN]-(this34:Person)
                  CALL (this34) {
                    CALL (*) {
                      WITH *
                      MATCH (this34)-[this35:ACTED_IN]->(this36:Movie)
                      WITH this36 { .title, __resolveType: 'Movie', __id: elementId(this36) } AS var37
                      RETURN var37
                      UNION
                      WITH *
                      MATCH (this34)-[this38:ACTED_IN]->(this39:Series)
                      WITH this39 { .title, __resolveType: 'Series', __id: elementId(this39) } AS var37
                      RETURN var37
                    }
                    WITH var37
                    RETURN head(collect(var37)) AS var37
                  }
                  WITH this34 { .name, actedIn: var37, __resolveType: 'Person', __id: elementId(this34) } AS var32
                  RETURN var32
                }
                WITH var32
                RETURN collect(var32) AS var32
              }
              CALL (this24) {
                MATCH (this24)<-[this40:DIRECTED]-(this41:Person)
                WITH DISTINCT this41
                CALL (this41) {
                  CALL (*) {
                    WITH *
                    MATCH (this41)-[this42:DIRECTED]->(this43:Movie)
                    WITH this43 { .title, __resolveType: 'Movie', __id: elementId(this43) } AS var44
                    RETURN var44
                    UNION
                    WITH *
                    MATCH (this41)-[this45:DIRECTED]->(this46:Series)
                    WITH this46 { .title, __resolveType: 'Series', __id: elementId(this46) } AS var44
                    RETURN var44
                  }
                  WITH var44
                  RETURN collect(var44) AS var44
                }
                WITH this41 { .name, directed: var44 } AS this41
                RETURN head(collect(this41)) AS var47
              }
              WITH this24 { actor: var32, director: var47, __resolveType: 'Series', __id: elementId(this24) } AS this
              RETURN this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });

    test("returns filtered fields", async () => {
        const query = `
            query {
              productions {
                    actor(where: { name: { eq: "Hachiko" }}) {
                        name
                        actedIn {
                            title
                        }
                    }
                    director {
                       name
                       directed(where: { title: { eq: "The Office"} }) {
                            title
                       }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
              MATCH (this0:Movie)
              CALL (this0) {
                CALL (*) {
                  WITH *
                  MATCH (this0)<-[this1:ACTED_IN]-(this2:Dog)
                  WHERE this2.name = $param0
                  CALL (this2) {
                    CALL (*) {
                      WITH *
                      MATCH (this2)-[this3:ACTED_IN]->(this4:Movie)
                      WITH this4 { .title, __resolveType: 'Movie', __id: elementId(this4) } AS var5
                      RETURN var5
                      UNION
                      WITH *
                      MATCH (this2)-[this6:ACTED_IN]->(this7:Series)
                      WITH this7 { .title, __resolveType: 'Series', __id: elementId(this7) } AS var5
                      RETURN var5
                    }
                    WITH var5
                    RETURN head(collect(var5)) AS var5
                  }
                  WITH this2 { .name, actedIn: var5, __resolveType: 'Dog', __id: elementId(this2) } AS var8
                  RETURN var8
                  UNION
                  WITH *
                  MATCH (this0)<-[this9:ACTED_IN]-(this10:Person)
                  WHERE this10.name = $param1
                  CALL (this10) {
                    CALL (*) {
                      WITH *
                      MATCH (this10)-[this11:ACTED_IN]->(this12:Movie)
                      WITH this12 { .title, __resolveType: 'Movie', __id: elementId(this12) } AS var13
                      RETURN var13
                      UNION
                      WITH *
                      MATCH (this10)-[this14:ACTED_IN]->(this15:Series)
                      WITH this15 { .title, __resolveType: 'Series', __id: elementId(this15) } AS var13
                      RETURN var13
                    }
                    WITH var13
                    RETURN head(collect(var13)) AS var13
                  }
                  WITH this10 { .name, actedIn: var13, __resolveType: 'Person', __id: elementId(this10) } AS var8
                  RETURN var8
                }
                WITH var8
                RETURN collect(var8) AS var8
              }
              CALL (this0) {
                MATCH (this0)<-[this16:DIRECTED]-(this17:Person)
                WITH DISTINCT this17
                CALL (this17) {
                  CALL (*) {
                    WITH *
                    MATCH (this17)-[this18:DIRECTED]->(this19:Movie)
                    WHERE this19.title = $param2
                    WITH this19 { .title, __resolveType: 'Movie', __id: elementId(this19) } AS var20
                    RETURN var20
                    UNION
                    WITH *
                    MATCH (this17)-[this21:DIRECTED]->(this22:Series)
                    WHERE this22.title = $param3
                    WITH this22 { .title, __resolveType: 'Series', __id: elementId(this22) } AS var20
                    RETURN var20
                  }
                  WITH var20
                  RETURN collect(var20) AS var20
                }
                WITH this17 { .name, directed: var20 } AS this17
                RETURN head(collect(this17)) AS var23
              }
              WITH this0 { actor: var8, director: var23, __resolveType: 'Movie', __id: elementId(this0) } AS this
              RETURN this
              UNION
              MATCH (this24:Series)
              CALL (this24) {
                CALL (*) {
                  WITH *
                  MATCH (this24)<-[this25:ACTED_IN]-(this26:Dog)
                  WHERE this26.name = $param4
                  CALL (this26) {
                    CALL (*) {
                      WITH *
                      MATCH (this26)-[this27:ACTED_IN]->(this28:Movie)
                      WITH this28 { .title, __resolveType: 'Movie', __id: elementId(this28) } AS var29
                      RETURN var29
                      UNION
                      WITH *
                      MATCH (this26)-[this30:ACTED_IN]->(this31:Series)
                      WITH this31 { .title, __resolveType: 'Series', __id: elementId(this31) } AS var29
                      RETURN var29
                    }
                    WITH var29
                    RETURN head(collect(var29)) AS var29
                  }
                  WITH this26 { .name, actedIn: var29, __resolveType: 'Dog', __id: elementId(this26) } AS var32
                  RETURN var32
                  UNION
                  WITH *
                  MATCH (this24)<-[this33:ACTED_IN]-(this34:Person)
                  WHERE this34.name = $param5
                  CALL (this34) {
                    CALL (*) {
                      WITH *
                      MATCH (this34)-[this35:ACTED_IN]->(this36:Movie)
                      WITH this36 { .title, __resolveType: 'Movie', __id: elementId(this36) } AS var37
                      RETURN var37
                      UNION
                      WITH *
                      MATCH (this34)-[this38:ACTED_IN]->(this39:Series)
                      WITH this39 { .title, __resolveType: 'Series', __id: elementId(this39) } AS var37
                      RETURN var37
                    }
                    WITH var37
                    RETURN head(collect(var37)) AS var37
                  }
                  WITH this34 { .name, actedIn: var37, __resolveType: 'Person', __id: elementId(this34) } AS var32
                  RETURN var32
                }
                WITH var32
                RETURN collect(var32) AS var32
              }
              CALL (this24) {
                MATCH (this24)<-[this40:DIRECTED]-(this41:Person)
                WITH DISTINCT this41
                CALL (this41) {
                  CALL (*) {
                    WITH *
                    MATCH (this41)-[this42:DIRECTED]->(this43:Movie)
                    WHERE this43.title = $param6
                    WITH this43 { .title, __resolveType: 'Movie', __id: elementId(this43) } AS var44
                    RETURN var44
                    UNION
                    WITH *
                    MATCH (this41)-[this45:DIRECTED]->(this46:Series)
                    WHERE this46.title = $param7
                    WITH this46 { .title, __resolveType: 'Series', __id: elementId(this46) } AS var44
                    RETURN var44
                  }
                  WITH var44
                  RETURN collect(var44) AS var44
                }
                WITH this41 { .name, directed: var44 } AS this41
                RETURN head(collect(this41)) AS var47
              }
              WITH this24 { actor: var32, director: var47, __resolveType: 'Series', __id: elementId(this24) } AS this
              RETURN this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Hachiko\\",
                \\"param1\\": \\"Hachiko\\",
                \\"param2\\": \\"The Office\\",
                \\"param3\\": \\"The Office\\",
                \\"param4\\": \\"Hachiko\\",
                \\"param5\\": \\"Hachiko\\",
                \\"param6\\": \\"The Office\\",
                \\"param7\\": \\"The Office\\"
            }"
        `);
    });

    test("nested filter", async () => {
        const query = `
            query {
               productions(where: { director: { name: { eq: "Director" } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
              MATCH (this0:Movie)
              WHERE EXISTS {
                MATCH (this0)<-[:DIRECTED]-(this1:Person)
                WHERE this1.name = $param0
              }
              WITH this0 { .title, __resolveType: 'Movie', __id: elementId(this0) } AS this
              RETURN this
              UNION
              MATCH (this2:Series)
              WHERE EXISTS {
                MATCH (this2)<-[:DIRECTED]-(this3:Person)
                WHERE this3.name = $param1
              }
              WITH this2 { .title, __resolveType: 'Series', __id: elementId(this2) } AS this
              RETURN this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Director\\",
                \\"param1\\": \\"Director\\"
            }"
        `);
    });

    test("double nested filter", async () => {
        const query = `
            query {
                actors(where: { actedIn: { director: { name: { eq: "Director" } } } }) {
                    name
                    actedIn {
                        title
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
              MATCH (this0:Dog)
              WHERE (EXISTS {
                MATCH (this0)-[:ACTED_IN]->(this1:Movie)
                WHERE EXISTS {
                  MATCH (this1)<-[:DIRECTED]-(this2:Person)
                  WHERE this2.name = $param0
                }
              } OR EXISTS {
                MATCH (this0)-[:ACTED_IN]->(this3:Series)
                WHERE EXISTS {
                  MATCH (this3)<-[:DIRECTED]-(this4:Person)
                  WHERE this4.name = $param1
                }
              })
              CALL (this0) {
                CALL (*) {
                  WITH *
                  MATCH (this0)-[this5:ACTED_IN]->(this6:Movie)
                  WITH this6 { .title, __resolveType: 'Movie', __id: elementId(this6) } AS var7
                  RETURN var7
                  UNION
                  WITH *
                  MATCH (this0)-[this8:ACTED_IN]->(this9:Series)
                  WITH this9 { .title, __resolveType: 'Series', __id: elementId(this9) } AS var7
                  RETURN var7
                }
                WITH var7
                RETURN head(collect(var7)) AS var7
              }
              WITH this0 { .name, actedIn: var7, __resolveType: 'Dog', __id: elementId(this0) } AS this
              RETURN this
              UNION
              MATCH (this10:Person)
              WHERE (EXISTS {
                MATCH (this10)-[:ACTED_IN]->(this11:Movie)
                WHERE EXISTS {
                  MATCH (this11)<-[:DIRECTED]-(this12:Person)
                  WHERE this12.name = $param2
                }
              } OR EXISTS {
                MATCH (this10)-[:ACTED_IN]->(this13:Series)
                WHERE EXISTS {
                  MATCH (this13)<-[:DIRECTED]-(this14:Person)
                  WHERE this14.name = $param3
                }
              })
              CALL (this10) {
                CALL (*) {
                  WITH *
                  MATCH (this10)-[this15:ACTED_IN]->(this16:Movie)
                  WITH this16 { .title, __resolveType: 'Movie', __id: elementId(this16) } AS var17
                  RETURN var17
                  UNION
                  WITH *
                  MATCH (this10)-[this18:ACTED_IN]->(this19:Series)
                  WITH this19 { .title, __resolveType: 'Series', __id: elementId(this19) } AS var17
                  RETURN var17
                }
                WITH var17
                RETURN head(collect(var17)) AS var17
              }
              WITH this10 { .name, actedIn: var17, __resolveType: 'Person', __id: elementId(this10) } AS this
              RETURN this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Director\\",
                \\"param1\\": \\"Director\\",
                \\"param2\\": \\"Director\\",
                \\"param3\\": \\"Director\\"
            }"
        `);
    });

    test("nested filter with edge properties", async () => {
        const query = `
            query {
               productions(where: { directorConnection: { edge: { Directed: { year: { gt: 1992 } } } } }) {
                    title
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
              MATCH (this0:Movie)
              WHERE EXISTS {
                MATCH (this0)<-[this1:DIRECTED]-(this2:Person)
                WHERE this1.year > $param0
              }
              WITH this0 { .title, __resolveType: 'Movie', __id: elementId(this0) } AS this
              RETURN this
              UNION
              MATCH (this3:Series)
              WHERE EXISTS {
                MATCH (this3)<-[this4:DIRECTED]-(this5:Person)
                WHERE this4.year > $param1
              }
              WITH this3 { .title, __resolveType: 'Series', __id: elementId(this3) } AS this
              RETURN this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1992,
                    \\"high\\": 0
                },
                \\"param1\\": {
                    \\"low\\": 1992,
                    \\"high\\": 0
                }
            }"
        `);
    });

    test("double nested filter with edge properties", async () => {
        const query = `
            query {
               actors(where: { actedInConnection: { node: { directorConnection: { OR: [{ edge: { Directed: { year: { gt: 1996 } } } }, { node: { name: { eq: "Director" } } }] } } }  }) {
                    name
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            CALL (*) {
              MATCH (this0:Dog)
              WHERE (EXISTS {
                MATCH (this0)-[this1:ACTED_IN]->(this2:Movie)
                WHERE EXISTS {
                  MATCH (this2)<-[this3:DIRECTED]-(this4:Person)
                  WHERE (this3.year > $param0 OR this4.name = $param1)
                }
              } OR EXISTS {
                MATCH (this0)-[this5:ACTED_IN]->(this6:Series)
                WHERE EXISTS {
                  MATCH (this6)<-[this7:DIRECTED]-(this8:Person)
                  WHERE (this7.year > $param2 OR this8.name = $param3)
                }
              })
              WITH this0 { .name, __resolveType: 'Dog', __id: elementId(this0) } AS this
              RETURN this
              UNION
              MATCH (this9:Person)
              WHERE (EXISTS {
                MATCH (this9)-[this10:ACTED_IN]->(this11:Movie)
                WHERE EXISTS {
                  MATCH (this11)<-[this12:DIRECTED]-(this13:Person)
                  WHERE (this12.year > $param4 OR this13.name = $param5)
                }
              } OR EXISTS {
                MATCH (this9)-[this14:ACTED_IN]->(this15:Series)
                WHERE EXISTS {
                  MATCH (this15)<-[this16:DIRECTED]-(this17:Person)
                  WHERE (this16.year > $param6 OR this17.name = $param7)
                }
              })
              WITH this9 { .name, __resolveType: 'Person', __id: elementId(this9) } AS this
              RETURN this
            }
            WITH this
            RETURN this AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"low\\": 1996,
                    \\"high\\": 0
                },
                \\"param1\\": \\"Director\\",
                \\"param2\\": {
                    \\"low\\": 1996,
                    \\"high\\": 0
                },
                \\"param3\\": \\"Director\\",
                \\"param4\\": {
                    \\"low\\": 1996,
                    \\"high\\": 0
                },
                \\"param5\\": \\"Director\\",
                \\"param6\\": {
                    \\"low\\": 1996,
                    \\"high\\": 0
                },
                \\"param7\\": \\"Director\\"
            }"
        `);
    });
});
