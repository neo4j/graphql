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
import { DocumentNode } from "graphql";
import { Neo4jGraphQL } from "../../../../../../src";
import { createJwtRequest } from "../../../../../../src/utils/test/utils";
import { formatCypher, translateQuery, formatParams } from "../../../../utils/tck-test-utils";

describe("Field Level Aggregations Alias", () => {
    const secret = "secret";
    let typeDefs: DocumentNode;
    let neoSchema: Neo4jGraphQL;

    beforeAll(() => {
        typeDefs = gql`
            type Movie @node(label: "Film") {
                title: String
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
            }

            type Actor @node(label: "Person") {
                name: String
                age: Int
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            interface ActedIn {
                time: Int
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            config: { enableRegex: true, jwt: { secret } },
        });
    });

    test("Aggregation with labels", async () => {
        const query = gql`
            query {
                movies {
                    actorsAggregate {
                        node {
                            name {
                                shortest
                            }
                        }
                    }
                }
            }
        `;

        const req = createJwtRequest("secret", {});
        const result = await translateQuery(neoSchema, query, {
            req,
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "MATCH (this:Film)
            RETURN this { actorsAggregate: { node: { name: head(apoc.cypher.runFirstColumn(\\" MATCH (this)<-[r:ACTED_IN]-(n:Person)
                    WITH n as n
                    ORDER BY size(n.name) DESC
                    WITH collect(n.name) as list
                    RETURN {longest: head(list), shortest: last(list)} \\", { this: this })) } } } as this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`"{}"`);
    });
});
