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

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Nested Unions", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type Series @node {
                name: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            union Production = Movie | Series

            type LeadActor @node {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Extra @node {
                name: String
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            union Actor = LeadActor | Extra
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Nested Unions - Connect -> Connect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "Movie" } }
                    update: {
                        actors: {
                            LeadActor: {
                                connect: {
                                    where: { node: { name: { eq: "Actor" } } }
                                    connect: { actedIn: { Series: { where: { node: { name: { eq: "Series" } } } } } }
                                }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        actors {
                            ... on LeadActor {
                                name
                                actedIn {
                                    ... on Series {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    MATCH (this0:LeadActor)
                    WHERE this0.name = $param1
                    CALL (this0) {
                        MATCH (this1:Movie)
                        CREATE (this0)-[this2:ACTED_IN]->(this1)
                    }
                    CALL (this0) {
                        MATCH (this3:Series)
                        CREATE (this0)-[this4:ACTED_IN]->(this3)
                    }
                    CREATE (this)<-[this5:ACTED_IN]-(this0)
                }
            }
            WITH this
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)<-[this6:ACTED_IN]-(this7:LeadActor)
                    CALL (this7) {
                        CALL (*) {
                            WITH *
                            MATCH (this7)-[this8:ACTED_IN]->(this9:Movie)
                            WITH this9 { __resolveType: \\"Movie\\", __id: id(this9) } AS var10
                            RETURN var10
                            UNION
                            WITH *
                            MATCH (this7)-[this11:ACTED_IN]->(this12:Series)
                            WITH this12 { .name, __resolveType: \\"Series\\", __id: id(this12) } AS var10
                            RETURN var10
                        }
                        WITH var10
                        RETURN collect(var10) AS var10
                    }
                    WITH this7 { .name, actedIn: var10, __resolveType: \\"LeadActor\\", __id: id(this7) } AS var13
                    RETURN var13
                    UNION
                    WITH *
                    MATCH (this)<-[this14:ACTED_IN]-(this15:Extra)
                    WITH this15 { __resolveType: \\"Extra\\", __id: id(this15) } AS var13
                    RETURN var13
                }
                WITH var13
                RETURN collect(var13) AS var13
            }
            RETURN this { .title, actors: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Movie\\",
                \\"param1\\": \\"Actor\\"
            }"
        `);
    });

    test("Nested Unions - Disconnect -> Disconnect", async () => {
        const query = /* GraphQL */ `
            mutation {
                updateMovies(
                    where: { title: { eq: "Movie" } }
                    update: {
                        actors: {
                            LeadActor: {
                                disconnect: {
                                    where: { node: { name: { eq: "Actor" } } }
                                    disconnect: { actedIn: { Series: { where: { node: { name: { eq: "Series" } } } } } }
                                }
                            }
                        }
                    }
                ) {
                    movies {
                        title
                        actors {
                            ... on LeadActor {
                                name
                                actedIn {
                                    ... on Series {
                                        name
                                    }
                                }
                            }
                        }
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            WITH *
            WHERE this.title = $param0
            WITH *
            CALL (*) {
                CALL (this) {
                    OPTIONAL MATCH (this)<-[this0:ACTED_IN]-(this1:LeadActor)
                    WHERE this1.name = $param1
                    CALL (this1) {
                        CALL (this1) {
                            OPTIONAL MATCH (this1)-[this2:ACTED_IN]->(this3:Movie)
                            WITH *
                            DELETE this2
                        }
                    }
                    CALL (this1) {
                        CALL (this1) {
                            OPTIONAL MATCH (this1)-[this4:ACTED_IN]->(this5:Series)
                            WITH *
                            DELETE this4
                        }
                    }
                    WITH *
                    DELETE this0
                }
            }
            WITH this
            CALL (this) {
                CALL (*) {
                    WITH *
                    MATCH (this)<-[this6:ACTED_IN]-(this7:LeadActor)
                    CALL (this7) {
                        CALL (*) {
                            WITH *
                            MATCH (this7)-[this8:ACTED_IN]->(this9:Movie)
                            WITH this9 { __resolveType: \\"Movie\\", __id: id(this9) } AS var10
                            RETURN var10
                            UNION
                            WITH *
                            MATCH (this7)-[this11:ACTED_IN]->(this12:Series)
                            WITH this12 { .name, __resolveType: \\"Series\\", __id: id(this12) } AS var10
                            RETURN var10
                        }
                        WITH var10
                        RETURN collect(var10) AS var10
                    }
                    WITH this7 { .name, actedIn: var10, __resolveType: \\"LeadActor\\", __id: id(this7) } AS var13
                    RETURN var13
                    UNION
                    WITH *
                    MATCH (this)<-[this14:ACTED_IN]-(this15:Extra)
                    WITH this15 { __resolveType: \\"Extra\\", __id: id(this15) } AS var13
                    RETURN var13
                }
                WITH var13
                RETURN collect(var13) AS var13
            }
            RETURN this { .title, actors: var13 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"Movie\\",
                \\"param1\\": \\"Actor\\"
            }"
        `);
    });
});
