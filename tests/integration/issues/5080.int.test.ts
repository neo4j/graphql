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

import { createBearerToken } from "../../utils/create-bearer-token";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/5080", () => {
    let User: UniqueType;
    let Tenant: UniqueType;
    let DeletedCar: UniqueType;
    let Car: UniqueType;

    const secret = "secret";
    const testHelper = new TestHelper();

    beforeEach(async () => {
        User = testHelper.createUniqueType("User");
        Tenant = testHelper.createUniqueType("Tenant");
        Car = testHelper.createUniqueType("Car");

        const typeDefs = /* GraphQL */ `
            type JWT @jwt {
                id: String
            }
            type ${User} @authorization(filter: [{ where: { node: { userId: "$jwt.id" } } }]) {
                userId: String! @unique
                adminAccess: [${Tenant}!]! @relationship(type: "ADMIN_IN", direction: OUT, aggregate: false)
            }
            type ${Tenant} @authorization(validate: [{ where: { node: { admins: { userId: "$jwt.id" } } } }]) {
                id: ID! @id
                admins: [${User}!]! @relationship(type: "ADMIN_IN", direction: IN, aggregate: false)
                deletedCars: [${DeletedCar}!]! @relationship(type: "OWNED_BY", direction: IN, aggregate: false)
                cars: [${Car}!]! @relationship(type: "OWNED_BY", direction: IN, aggregate: false)
            }

            input DeleteCarInput {
                carId: ID!
                reason: String!
            }
         
            type ${Car} 
                @mutation(operations: [UPDATE])
                @authorization(validate: [{ where: { node: { owner: { admins: { userId: "$jwt.id" } } } } }]) {
                id: ID! @id
                owner: ${Tenant}! @relationship(type: "OWNED_BY", direction: OUT, aggregate: false)
                name: String!
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            }

            type ${DeletedCar} 
                @mutation(operations: [UPDATE])
                @authorization(validate: [{ where: { node: { owner: { admins: { userId: "$jwt.id" } } } } }]) {
                id: ID! @id
                owner: ${Tenant}! @relationship(type: "OWNED_BY", direction: OUT, aggregate: false)
                name: String!
                reason: String!
                createdAt: DateTime! @timestamp(operations: [CREATE])
                updatedAt: DateTime! @timestamp(operations: [CREATE, UPDATE])
            }

            type Mutation {
                deleteCar(input: DeleteCarInput!): ${DeletedCar}!
                    @cypher(
                        statement: """
                        MATCH(s:${Car})
                        WHERE (s.id = $input.carId)
                        REMOVE s:${Car}
                        SET s:${DeletedCar}
                        SET s.reason = $input.reason
                        RETURN s AS s
                        """
                        columnName: "s"
                    )
            }

            extend schema @authentication @query(read: true, aggregate: false)

        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {
                authorization: {
                    key: secret,
                },
            },
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("custom cypher should apply correctly authorization validation rule and not throw when criteria are meet", async () => {
        const mutation = /* GraphQL */ `
            mutation deleteCar {
                deleteCar(input: { carId: "1", reason: "reason" }) {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${Car} { id: "1" })-[r:OWNED_BY]->(:${Tenant} { id: "2" })<-[:ADMIN_IN]-(:${User} { userId: "1" })
            CREATE (:${Car} { id: "2" })
        `);

        const token = createBearerToken(secret, { id: "1" });
        const result = await testHelper.executeGraphQLWithToken(mutation, token);
        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            deleteCar: { id: "1" },
        });
    });

    test("custom cypher should apply correctly authorization validation rule and throw when criteria are not meet", async () => {
        const mutation = /* GraphQL */ `
            mutation deleteCar {
                deleteCar(input: { carId: "2", reason: "reason" }) {
                    id
                }
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:${Car} { id: "1" })-[r:OWNED_BY]->(:${Tenant} { id: "2" })<-[:ADMIN_IN]-(:${User} { userId: "1" })
            CREATE (:${Car} { id: "2" })
        `);

        const token = createBearerToken(secret, { id: "1" });
        const result = await testHelper.executeGraphQLWithToken(mutation, token);
        expect((result.errors as any[])[0].message).toBe("Forbidden");
    });
});
