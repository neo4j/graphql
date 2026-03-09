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

describe("Type defs are valid with different cardinality", () => {
    let Person: UniqueType;
    let Movie: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(() => {
        Person = testHelper.createUniqueType("Person");
        Movie = testHelper.createUniqueType("Movie");
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("many-to-many modeled on 1 side only", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
            }

            type ${Movie} @node {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
    });

    test("one-to-many and many-to-many", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", direction: OUT)
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }
    
            type ${Movie} @node {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", direction: IN)
                director: ${Person} @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                ${Movie.plural} {
                    title
                    actors {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
    });
    test("one-to-one", async () => {
        const typeDefs = /* GraphQL */ `
            type ${Person} @node {    
                name: String!
                spouse: ${Person} @relationship(type: "MARRIED", direction: OUT)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
        const query = /* GraphQL */ `
            query {
                ${Person.plural} {
                    name
                    spouse {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
    });
});
