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

import { Neo4jGraphQL } from "../../../src";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5635", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type Owner {
                id: ID! @unique @id
                owns: [MyNode!]! @relationship(type: "OWNS", direction: OUT)
            }

            type MyNode
                @authorization(
                    validate: [
                        {
                            operations: [READ, UPDATE, DELETE, DELETE_RELATIONSHIP, CREATE_RELATIONSHIP]
                            where: { node: { owner: { id: "$jwt.sub" } } }
                            when: [AFTER]
                        }
                    ]
                ) {
                id: ID! @unique @id
                name: String!
                owner: Owner! @relationship(type: "OWNS", direction: IN)
            }
        `;
        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: { key: "secret" },
            },
        });
    });

    test("validation should applied correctly without causing cypher errors", async () => {
        const mutation = /* GraphQL */ `
            mutation {
                createMyNodes(
                    input: [
                        {
                            name: "Test"
                            owner: { connectOrCreate: { onCreate: { node: {} }, where: { node: { id: "abc" } } } }
                        }
                    ]
                ) {
                    myNodes {
                        id
                        name
                    }
                }
            }
        `;

        const result = await translateQuery(neoSchema, mutation);

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
            CREATE (this0:MyNode)
            SET this0.id = randomUUID()
            SET this0.name = $this0_name
            WITH this0
            CALL {
                WITH this0
                MERGE (this0_owner_connectOrCreate0:Owner { id: $this0_owner_connectOrCreate_param0 })
                MERGE (this0)<-[this0_owner_connectOrCreate_this0:OWNS]-(this0_owner_connectOrCreate0)
                WITH *
                OPTIONAL MATCH (this0)<-[:OWNS]-(this0_owner_connectOrCreate_this1:Owner)
                WITH *, count(this0_owner_connectOrCreate_this1) AS ownerCount
                WITH *
                WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (ownerCount <> 0 AND ($jwt.sub IS NOT NULL AND this0_owner_connectOrCreate_this1.id = $jwt.sub))), \\"@neo4j/graphql/FORBIDDEN\\", [0])
                RETURN count(*) AS _
            }
            WITH *
            CALL {
            	WITH this0
            	MATCH (this0)<-[this0_owner_Owner_unique:OWNS]-(:Owner)
            	WITH count(this0_owner_Owner_unique) as c
            	WHERE apoc.util.validatePredicate(NOT (c = 1), '@neo4j/graphql/RELATIONSHIP-REQUIREDMyNode.owner required exactly once', [0])
            	RETURN c AS this0_owner_Owner_unique_ignored
            }
            RETURN this0
            }
            CALL {
                WITH this0
                RETURN this0 { .id, .name } AS create_var0
            }
            RETURN [create_var0] AS data"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"this0_name\\": \\"Test\\",
                \\"this0_owner_connectOrCreate_param0\\": \\"abc\\",
                \\"isAuthenticated\\": false,
                \\"jwt\\": {},
                \\"resolvedCallbacks\\": {}
            }"
        `);
    });
});
