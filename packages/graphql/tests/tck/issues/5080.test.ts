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
import { createBearerToken } from "../../utils/create-bearer-token";
import { formatCypher, formatParams, translateQuery } from "../utils/tck-test-utils";

describe("https://github.com/neo4j/graphql/issues/5080", () => {
    let typeDefs: string;
    let neoSchema: Neo4jGraphQL;
    const secret = "secret";

    beforeAll(() => {
        typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: String
            }
            type User @authorization(filter: [{ where: { node: { userId: "$jwt.id" } } }]) {
                userId: String! @unique
                adminAccess: [Tenant!]! @relationship(type: "ADMIN_IN", direction: OUT, aggregate: false)
            }

            type Tenant @authorization(validate: [{ where: { node: { admins: { userId: "$jwt.id" } } } }]) {
                id: ID! @id
                admins: [User!]! @relationship(type: "ADMIN_IN", direction: IN, aggregate: false)
                deletedCars: [DeletedCar!]! @relationship(type: "OWNED_BY", direction: IN, aggregate: false)
                cars: [Car!]! @relationship(type: "OWNED_BY", direction: IN, aggregate: false)
            }

            input DeleteCarInput {
                carId: ID!
                reason: String!
            }
            type Mutation {
                deleteCar(input: DeleteCarInput!): DeletedCar!
                    @cypher(
                        statement: """
                        MATCH(s:Car)
                        WHERE (s.id = $input.carId)
                        REMOVE s:Car
                        SET s:DeletedCar
                        SET s.reason = $input.reason
                        RETURN s AS s
                        """
                        columnName: "s"
                    )
            }

            type Car
                @mutation(operations: [UPDATE])
                @authorization(validate: [{ where: { node: { owner: { admins: { userId: "$jwt.id" } } } } }]) {
                id: ID! @id
                owner: Tenant! @relationship(type: "OWNED_BY", direction: OUT, aggregate: false)
                name: String!
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            }

            type DeletedCar
                @mutation(operations: [UPDATE])
                @authorization(validate: [{ where: { node: { owner: { admins: { userId: "$jwt.id" } } } } }]) {
                id: ID! @id
                owner: Tenant! @relationship(type: "OWNED_BY", direction: OUT, aggregate: false)
                name: String!
                reason: String!
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            }

            extend schema @authentication @query(read: true, aggregate: false)
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    test("custom cypher should apply correctly authorization validation rule", async () => {
        const mutation = /* GraphQL */ `
            mutation videos {
                deleteCar(input: { carId: "1", reason: "reason" }) {
                    id
                }
            }
        `;

        const token = createBearerToken(secret, { id: "1" });
        const result = await translateQuery(neoSchema, mutation, {
            contextValues: {
                token,
            },
        });

        expect(formatCypher(result.cypher)).toMatchInlineSnapshot(`
            "CALL {
                MATCH(s:Car)
                WHERE (s.id = $param0.carId)
                REMOVE s:Car
                SET s:DeletedCar
                SET s.reason = $param0.reason
                RETURN s AS s
            }
            WITH s AS this0
            OPTIONAL MATCH (this0)-[:OWNED_BY]->(this1:Tenant)
            WITH *, count(this1) AS ownerCount
            WITH *
            WHERE apoc.util.validatePredicate(NOT ($isAuthenticated = true AND (ownerCount <> 0 AND size([(this1)<-[:ADMIN_IN]-(this2:User) WHERE ($jwt.id IS NOT NULL AND this2.userId = $jwt.id) | 1]) > 0)), \\"@neo4j/graphql/FORBIDDEN\\", [0])
            WITH this0 { .id } AS this0
            RETURN this0 AS this"
        `);

        expect(formatParams(result.params)).toMatchInlineSnapshot(`
            "{
                \\"param0\\": {
                    \\"carId\\": \\"1\\",
                    \\"reason\\": \\"reason\\"
                },
                \\"isAuthenticated\\": true,
                \\"jwt\\": {
                    \\"roles\\": [],
                    \\"id\\": \\"1\\"
                }
            }"
        `);
    });
});
