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

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("query-direction", () => {
    const testHelper = new TestHelper();
    let Person: UniqueType;
    let stefan: string;
    let mike: string;
    let charlie: string;

    beforeEach(async () => {
        Person = testHelper.createUniqueType("Person");
        stefan = "Stefan";
        mike = "Mike";
        charlie = "Charlie";

        await testHelper.executeCypher(
            `
                CREATE (stefan:${Person} { name: "${stefan}" })
                CREATE (mike:${Person} { name: "${mike}" })
                CREATE (charlie:${Person} { name: "${charlie}" })
                CREATE (stefan)-[:HAS_FRIEND]->(mike)
                CREATE (mike)-[:HAS_FRIEND]->(charlie)
            `
        );
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return related node using the queryDirection DIRECTED", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
                friends: [${Person}!]! @relationship(type: "HAS_FRIEND", direction: OUT, queryDirection: DIRECTED)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
        const query = /* GraphQL */ `
            {
                ${Person.plural} {
                    name
                    friends {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Person.plural]: expect.toIncludeSameMembers([
                {
                    name: stefan,
                    friends: expect.toIncludeSameMembers([
                        {
                            name: mike,
                        },
                    ]),
                },
                {
                    name: mike,
                    friends: expect.toIncludeSameMembers([
                        {
                            name: charlie,
                        },
                    ]),
                },
                {
                    name: charlie,
                    friends: [],
                },
            ]),
        });
    });

    test("should return related node using the queryDirection UNDIRECTED", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
                friends: [${Person}!]! @relationship(type: "HAS_FRIEND", direction: OUT, queryDirection: UNDIRECTED)
            }
        `;
        await testHelper.initNeo4jGraphQL({ typeDefs });
        const query = /* GraphQL */ `
            {
                ${Person.plural} {
                    name
                    friends {
                        name
                    }
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect(gqlResult.data).toEqual({
            [Person.plural]: expect.toIncludeSameMembers([
                {
                    name: stefan,
                    friends: expect.toIncludeSameMembers([
                        {
                            name: mike,
                        },
                    ]),
                },
                {
                    name: mike,
                    friends: expect.toIncludeSameMembers([
                        {
                            name: stefan,
                        },
                        {
                            name: charlie,
                        },
                    ]),
                },
                {
                    name: charlie,
                    friends: expect.toIncludeSameMembers([
                        {
                            name: mike,
                        },
                    ]),
                },
            ]),
        });
    });
});
