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

import type { Driver, Session } from "neo4j-driver";
import { graphql } from "graphql";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2709", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Dishney: UniqueType;
    let Netflix: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Dishney = new UniqueType("Dishney");
        Netflix = new UniqueType("Netflix");

        const typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
                distribution: [DistributionHouse!]!
            }

            type ${Movie} implements Production @node(label: "Film") {
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

            interface ActedIn @relationshipProperties {
                role: String!
            }

            interface Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

        await session.run(`
            CREATE (:Film { title: "A Netflix movie" })<-[:DISTRIBUTED_BY]-(:${Netflix} { name: "Netflix" })
            CREATE (:Film { title: "A Dishney movie" })<-[:DISTRIBUTED_BY]-(:${Dishney} { name: "Dishney" })
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Netflix, Dishney]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should query only DistributionHouses with the label Netflix", async () => {
        const query = `
            query {
                ${Movie.plural}(
                    where: { OR: [{ distributionConnection_SOME: { node: { _on: { ${Netflix}: {} }, name: "Netflix" } } }] }
                ) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Movie.plural]: [
                {
                    title: "A Netflix movie",
                },
            ],
        });
    });

    test("should query only DistributionHouses with the label Dishney", async () => {
        const query = `
            query {
                ${Movie.plural}(
                    where: { OR: [{ distributionConnection_SOME: { node: { _on: { ${Dishney}: {} }, name: "Dishney" } } }] }
                ) {
                    title
                }
            }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

        expect(result.errors).toBeFalsy();
        expect(result.data as any).toEqual({
            [Movie.plural]: [
                {
                    title: "A Dishney movie",
                },
            ],
        });
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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Dishney: UniqueType;
    let Netflix: UniqueType;
    let Publisher: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Dishney = new UniqueType("Dishney");
        Netflix = new UniqueType("Netflix");
        Publisher = new UniqueType("Publisher");

        const typeDefs = `
            interface Production {
                title: String!
                actors: [Actor!]!
                distribution: [DistributionHouse!]!
            }

            type ${Movie} implements Production @node(label: "Film") {
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

            interface ActedIn @relationshipProperties {
                role: String!
            }

            interface Actor {
                name: String!
                actedIn: [Production!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
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

        await session.run(`
            CREATE (:Film { title: "A Netflix movie" })<-[:DISTRIBUTED_BY]-(:${Netflix} { name: "Netflix" })
            CREATE (:Film { title: "A Dishney movie" })<-[:DISTRIBUTED_BY]-(:${Dishney} { name: "Dishney" })
            CREATE (:Film { title: "A Publisher movie" })<-[:DISTRIBUTED_BY]-(:${Publisher} { name: "The Publisher" })
        `);

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Netflix, Dishney, Publisher]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
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

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });

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
