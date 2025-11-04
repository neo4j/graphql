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

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/594", () => {
    const testHelper = new TestHelper();

    let typeMovie: UniqueType;
    let typePerson: UniqueType;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typePerson = testHelper.createUniqueType("Person");
        const typeDefs = gql`
            type ${typeMovie.name} {
                title: String!
                actors: [${typePerson.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }

            type ${typePerson.name} {
                name: String!
                nickname: String
                surname: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`CREATE (:${typeMovie.name} {title: "Cool Movie"})<-[:ACTED_IN]-(:${typePerson.name} {name: "Some Name", nickname: "SName"})
                CREATE (:${typeMovie.name} {title: "Super Cool Movie"})<-[:ACTED_IN]-(:${typePerson.name} {name: "Super Cool Some Name"})`);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should support nullable fields in field aggregations", async () => {
        const query = `
            query {
                ${typeMovie.plural} {
                    actorsAggregate {
                        node {
                            nickname {
                                shortest
                            }
                        }
                    }
                }
            }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[typeMovie.plural]).toEqual(
            expect.toIncludeSameMembers([
                { actorsAggregate: { node: { nickname: { shortest: "SName" } } } },
                { actorsAggregate: { node: { nickname: { shortest: null } } } },
            ])
        );
    });

    test("should support nullable fields in aggregations", async () => {
        const query = `
            query {
                ${typePerson.plural}Aggregate {
                    surname {
                        shortest
                    }
                }
            }
        `;

        const gqlResult: any = await testHelper.executeGraphQL(query);

        expect(gqlResult.errors).toBeUndefined();
        expect(gqlResult.data[`${typePerson.plural}Aggregate`]).toEqual({ surname: { shortest: null } });
    });
});
