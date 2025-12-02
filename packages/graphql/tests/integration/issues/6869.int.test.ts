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

import { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/6869", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let OrganizationLabel: UniqueType;
    let PersonLabel: UniqueType;

    beforeAll(async () => {
        PersonLabel = new UniqueType("FiboPeople__Person");
        OrganizationLabel = new UniqueType("FiboOrganizations__Organization");

        typeDefs = /* GraphQL */ `
            union AbstractUnion = Organization | Person

            interface AbstractInterface {
                type: String
                uri: String
                name: String @alias(property: "dc__title")
                description: String @alias(property: "dc__description")
            }

            type Organization implements AbstractInterface @node(labels: ["${OrganizationLabel}"]) {
                type: String
                uri: String
                name: String @alias(property: "dc__title")
                description: String @alias(property: "dc__description")
            }

            type Person implements AbstractInterface @node(labels: ["${PersonLabel}"]) {
                type: String
                uri: String
                name: String @alias(property: "dc__title")
                description: String @alias(property: "dc__description")
            }

            type Query {
                resourceSearchInterface: [AbstractInterface]
                    @cypher(
                        statement: """
                        MATCH(p:${PersonLabel})
                        RETURN p as node
                        """
                        columnName: "node"
                    )
                resourceSearchUnion: [AbstractUnion]
                    @cypher(
                        statement: """
                        MATCH(p:${PersonLabel})
                        RETURN p as node
                        """
                        columnName: "node"
                    )
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
            features: {},
        });

        await testHelper.executeCypher(`
            CREATE (:${PersonLabel} {
                type: "Person",
                uri: "an-uri",
                dc__title: "A cool person",
                dc__description: "A cool person"
            })
            CREATE (:${OrganizationLabel} {             
                type: "Org",
                uri: "an-org-uri",
                dc__title: "A cool org",
                dc__description: "A cool org" 
            })
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("query custom cypher returning an interface", async () => {
        const query = /* GraphQL */ `
            query ExampleQuery {
                resourceSearchInterface {
                    uri
                    name
                    description
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            resourceSearchInterface: [
                {
                    description: "A cool person",
                    name: "A cool person",
                    uri: "an-uri",
                },
            ],
        });
    });
    test("query custom cypher returning an union", async () => {
        const query = /* GraphQL */ `
            query ExampleQuery {
                resourceSearchUnion {
                    ... on Person {
                        uri
                        name
                        description
                    }
                }
            }
        `;

        const queryResult = await testHelper.executeGraphQL(query);

        expect(queryResult.errors).toBeUndefined();
        expect(queryResult.data).toEqual({
            resourceSearchUnion: [
                {
                    description: "A cool person",
                    name: "A cool person",
                    uri: "an-uri",
                },
            ],
        });
    });
});
