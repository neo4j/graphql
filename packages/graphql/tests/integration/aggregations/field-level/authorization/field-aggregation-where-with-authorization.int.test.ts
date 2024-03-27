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

import { createBearerToken } from "../../../../utils/create-bearer-token";
import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe(`Field Level Authorization Where Requests`, () => {
    let token: string;
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typeActor: UniqueType;
    let typeDefs: string;

    const secret = "secret";

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");
        typeDefs = `
        type ${typeMovie.name} {
            name: String
            year: Int
            createdAt: DateTime
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN)
        }
    
        type ${typeActor.name} {
            name: String
            year: Int
            createdAt: DateTime
            testStr: String
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
        }`;

        await testHelper.executeCypher(`
            CREATE (m:${typeMovie.name}
                {name: "Terminator",year:1990,createdAt: datetime()})
                <-[:ACTED_IN]-
                (:${typeActor.name} { name: "Arnold", year: 1970, createdAt: datetime(), testStr: "1234"})
                CREATE (m)<-[:ACTED_IN]-(:${typeActor.name} {name: "Linda", year:1985, createdAt: datetime(), testStr: "1235"})`);

        const extendedTypeDefs = `${typeDefs}
        extend type ${typeActor.name} @authorization(filter: [{ operations: [AGGREGATE], where: { node: { testStr: "$jwt.sub" } } }])`;

        await testHelper.initNeo4jGraphQL({
            typeDefs: extendedTypeDefs,
            features: {
                authorization: {
                    key: "secret",
                },
            },
        });

        token = createBearerToken(secret, {
            roles: [],
            sub: "1234",
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("authenticated query", async () => {
        const query = `query {
            ${typeMovie.plural} {
                ${typeActor.plural}Aggregate(where: {year_GT: 10}) {
                    count
                    node {
                        year {
                            max
                        },
                        name {
                            longest,
                            shortest
                        }
                    },
                    }
                }
            }`;

        const gqlResult = await testHelper.executeGraphQLWithToken(query, token);
        expect(gqlResult.errors).toBeUndefined();
        expect((gqlResult as any).data[typeMovie.plural][0][`${typeActor.plural}Aggregate`]).toEqual({
            count: 1,
            node: {
                year: {
                    max: 1970,
                },
                name: {
                    longest: "Arnold",
                    shortest: "Arnold",
                },
            },
        });
    });
});
