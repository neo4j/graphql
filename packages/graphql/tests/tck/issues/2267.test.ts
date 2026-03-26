/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2267", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Place @node {
                displayName: String!
                activity: [Publication!]! @relationship(type: "ACTIVITY", direction: IN)
            }

            interface Publication {
                name: String
                activity: [Place!]! @declareRelationship
            }

            type Post implements Publication @node {
                name: String
                activity: [Place!]! @relationship(type: "ACTIVITY", direction: OUT)
            }

            type Story implements Publication @node {
                name: String
                activity: [Place!]! @relationship(type: "ACTIVITY", direction: OUT)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("sort should be correct when querying interface relationship field", async () => {
        const query = /* GraphQL */ `
            query {
                places(sort: { displayName: ASC }) {
                    displayName
                    activity {
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CYPHER 5
            MATCH (this:Place)
            WITH *
            ORDER BY this.displayName ASC
            CALL (this) {
              CALL (*) {
                WITH *
                MATCH (this)<-[this0:ACTIVITY]-(this1:Post)
                WITH this1 { .name, __resolveType: 'Post', __id: elementId(this1) } AS var2
                RETURN var2
                UNION
                WITH *
                MATCH (this)<-[this3:ACTIVITY]-(this4:Story)
                WITH this4 { .name, __resolveType: 'Story', __id: elementId(this4) } AS var2
                RETURN var2
              }
              WITH var2
              RETURN collect(var2) AS var2
            }
            RETURN this { .displayName, activity: var2 } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
