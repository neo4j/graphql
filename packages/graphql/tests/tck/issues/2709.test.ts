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

import { gql } from "apollo-server";
import { Neo4jGraphQL } from "../../../src";
import { formatCypher, translateQuery, formatParams } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/2709", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
                distribution: [DistributionHouse!]!
            }

            type Movie implements Production @node(labels: ["Film"]) {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
                distribution: [DistributionHouse!]! @relationship(type: "DISTRIBUTED_BY", direction: IN)
            }

            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
                distribution: [DistributionHouse!]! @relationship(type: "DISTRIBUTED_BY", direction: IN)
            }

            interface ActedIn @relationshipProperties {
                role: String!
            }

            interface Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type MaleActor implements Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                rating: Int!
            }
            type FemaleActor implements Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
                age: Int!
            }

            interface DistributionHouse {
                name: String!
            }

            type Dishney implements DistributionHouse {
                name: String!
                review: String!
            }

            type Prime implements DistributionHouse {
                name: String!
                review: String!
            }

            type Netflix implements DistributionHouse {
                name: String!
                review: String!
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
        });
    });

    test("should use the correct node label for connection rel when defined in node _on - Netflix label", async () => {
        const query = gql`
            query {
                movies(
                    where: { OR: [{ distributionConnection_SOME: { node: { _on: { Netflix: {} }, name: "test" } } }] }
                ) {
                    title
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Film\`)
            WHERE EXISTS {
                MATCH (this)<-[this0:\`DISTRIBUTED_BY\`]-(this1:\`Netflix\`)
                WHERE this1.name = $param0
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test\\"
            }"
        `);
    });

    test("should use the correct node label for connection rel when defined in node _on - Dishney label", async () => {
        const query = gql`
            query {
                movies(
                    where: { OR: [{ distributionConnection_SOME: { node: { _on: { Dishney: {} }, name: "test2" } } }] }
                ) {
                    title
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Film\`)
            WHERE EXISTS {
                MATCH (this)<-[this0:\`DISTRIBUTED_BY\`]-(this1:\`Dishney\`)
                WHERE this1.name = $param0
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test2\\"
            }"
        `);
    });

    test("should use the correct node label for connection rel when defined in node _on - without OR operator", async () => {
        const query = gql`
            query {
                movies(where: { distributionConnection_SOME: { node: { _on: { Dishney: {} }, name: "test3" } } }) {
                    title
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Film\`)
            WHERE EXISTS {
                MATCH (this)<-[this0:\`DISTRIBUTED_BY\`]-(this1:\`Dishney\`)
                WHERE this1.name = $param0
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test3\\"
            }"
        `);
    });

    test("should not use a node label so it covers all nodes implementing the interface for connection rel", async () => {
        const query = gql`
            query {
                movies(where: { distributionConnection_SOME: { node: { name: "test4" } } }) {
                    title
                }
            }
        `;
        const result = await translateQuery(neoSchema, query);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:\`Film\`)
            WHERE EXISTS {
                MATCH (this)<-[this0:\`DISTRIBUTED_BY\`]-(this1)
                WHERE (this1.name = $param0 AND (this1:\`Dishney\` OR this1:\`Prime\` OR this1:\`Netflix\`))
            }
            RETURN this { .title } AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": \\"test4\\"
            }"
        `);
    });
});
