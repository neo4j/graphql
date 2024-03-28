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

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/2709", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Dishney: UniqueType;
    let Netflix: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Dishney = testHelper.createUniqueType("Dishney");
        Netflix = testHelper.createUniqueType("Netflix");

        const typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
                distribution: [DistributionHouse!]!
            }

            type ${Movie} implements Production @node(labels: ["Film"]) {
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

            type ActedIn @relationshipProperties {
                role: String!
            }

            interface Actor {
                name: String!
                actedIn: [Production!]! @declareRelationship
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

            type ${Dishney} implements DistributionHouse {
                name: String!
                review: String!
            }

            type Prime implements DistributionHouse {
                name: String!
                review: String!
            }

            type ${Netflix} implements DistributionHouse {
                name: String!
                review: String!
            }
        `;

        await testHelper.executeCypher(`
            CREATE (:Film { title: "A Netflix movie" })<-[:DISTRIBUTED_BY]-(:${Netflix} { name: "Netflix" })
            CREATE (:Film { title: "A Dishney movie" })<-[:DISTRIBUTED_BY]-(:${Dishney} { name: "Dishney" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should query the correct DistributionHouses when no _on present - Netflix", async () => {
        const query = `
            query {
                ${Movie.plural}(
                    where: { distributionConnection_SOME: { node: { name: "Netflix" } } }
                ) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Movie.plural]: [
                {
                    title: "A Netflix movie",
                },
            ],
        });
    });

    test("should query the correct DistributionHouses when no _on present - Dishney", async () => {
        const query = `
            query {
                ${Movie.plural}(
                    where: { distributionConnection_SOME: { node: { name: "Dishney" } } }
                ) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Movie.plural]: [
                {
                    title: "A Dishney movie",
                },
            ],
        });
    });
});

describe("https://github.com/neo4j/graphql/issues/2709 - extended", () => {
    const testHelper = new TestHelper();

    let Movie: UniqueType;
    let Dishney: UniqueType;
    let Netflix: UniqueType;
    let Publisher: UniqueType;

    beforeEach(async () => {
        Movie = testHelper.createUniqueType("Movie");
        Dishney = testHelper.createUniqueType("Dishney");
        Netflix = testHelper.createUniqueType("Netflix");
        Publisher = testHelper.createUniqueType("Publisher");

        const typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
                distribution: [DistributionHouse!]!
            }

            type ${Movie} implements Production @node(labels: ["Film"]) {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                runtime: Int!
                distribution: [DistributionHouse!]! @relationship(type: "DISTRIBUTED_BY", direction: IN)
                publisher: ${Publisher}! @relationship(type: "DISTRIBUTED_BY", direction: IN)
            }

            type Series implements Production {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", direction: IN, properties: "ActedIn")
                episodes: Int!
                distribution: [DistributionHouse!]! @relationship(type: "DISTRIBUTED_BY", direction: IN)
            }

            type ActedIn @relationshipProperties {
                role: String!
            }

            interface Actor {
                name: String!
                actedIn: [Production!]! @declareRelationship
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

            type ${Dishney} implements DistributionHouse {
                name: String!
                review: String!
            }

            type Prime implements DistributionHouse {
                name: String!
                review: String!
            }

            type ${Netflix} implements DistributionHouse {
                name: String!
                review: String!
            }

            ### Extension ###
            type ${Publisher} {
                name: String!
            }
            ################
        `;

        await testHelper.executeCypher(`
            CREATE (:Film { title: "A Netflix movie" })<-[:DISTRIBUTED_BY]-(:${Netflix} { name: "Netflix" })
            CREATE (:Film { title: "A Dishney movie" })<-[:DISTRIBUTED_BY]-(:${Dishney} { name: "Dishney" })
            CREATE (:Film { title: "A Publisher movie" })<-[:DISTRIBUTED_BY]-(:${Publisher} { name: "The Publisher" })
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should query only DistributionHouse nodes and NOT nodes (Publisher) which are connected by the same rel-type (DISTRIBUTED_BY)", async () => {
        const query = `
            query {
                ${Movie.plural}(
                    where: { distributionConnection_SOME: { node: { name_CONTAINS: "e" } } }
                ) {
                    title
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "A Netflix movie",
                },
                {
                    title: "A Dishney movie",
                },
            ]),
        });
        // Note: to not equal
        expect(result.data as any).not.toEqual({
            [Movie.plural]: expect.toIncludeSameMembers([
                {
                    title: "A Netflix movie",
                },
                {
                    title: "A Dishney movie",
                },
                {
                    title: "A Publisher movie",
                },
            ]),
        });
    });
});
