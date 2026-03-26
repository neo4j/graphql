/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../src";
import { formatCypher, formatParams, translateQuery } from "./utils/tck-test-utils";

describe("Cypher Alias", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Actor @node {
                name: String!
            }

            type Movie @node {
                id: ID
                releaseDate: DateTime!
                location: Point!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN)
                custom: [Movie!]!
                    @cypher(
                        statement: """
                        MATCH (m:Movie)
                        RETURN m
                        """
                        columnName: "m"
                    )
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("Alias", async () => {
        const query = /* GraphQL */ `
            {
                movies {
                    movieId: id
                    actors {
                        aliasActorsName: name
                    }
                    custom {
                        aliasCustomId: id
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        // NOTE: Order of these subqueries have been reversed after refactor
        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Movie)
            CALL (this) {
              CALL (this) {
                WITH this AS this
                MATCH (m:Movie)
                RETURN m
              }
              WITH m AS this0
              WITH this0 { aliasCustomId: this0.id } AS this0
              RETURN collect(this0) AS var1
            }
            CALL (this) {
              MATCH (this)<-[this2:ACTED_IN]-(this3:Actor)
              WITH DISTINCT this3
              WITH this3 { aliasActorsName: this3.name } AS this3
              RETURN collect(this3) AS var4
            }
            RETURN this { movieId: this.id, actors: var4, custom: var1 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
