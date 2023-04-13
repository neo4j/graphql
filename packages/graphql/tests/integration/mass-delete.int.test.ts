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

import type { DocumentNode } from "graphql";
import { graphql } from "graphql";
import type { Driver, Session } from "neo4j-driver";
import { cleanNodes } from "../utils/clean-nodes";
import { Neo4jGraphQL } from "../../src";
import { UniqueType } from "../utils/graphql-types";
import Neo4j from "./neo4j";
import { gql } from "graphql-tag";

describe("Mass Delete", () => {
    let driver: Driver;
    let session: Session;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;

    let typeDefs: DocumentNode;
    let personType: UniqueType;
    let movieType: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        personType = new UniqueType("Person");
        movieType = new UniqueType("Movie");

        typeDefs = gql`
            type ${personType.name} {
                name: String!
                born: Int!
                movies: [${movieType.name}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type ${movieType.name} {
                title: String!
                released: Int
                actors: [${personType.name}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });

        session = await neo4j.getSession();

        await session.run(`
            CREATE (m:${movieType.name} { title: "Sharknado", released: 2013 })
            WITH *
            UNWIND range(0, 100) AS x
            CREATE (p:${personType.name} { born: 1000+x, name: "Shark "+x })
            CREATE (m2:${movieType.name} { title: "Sharknado "+x, released: 2013 })
            CREATE (p)-[:ACTED_IN]->(m)
            CREATE (p)-[:ACTED_IN]->(m2)
        `);
    });

    afterEach(async () => {
        await cleanNodes(session, [movieType, personType]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("Should successfully delete many nodes in the same query", async () => {
        const mutation = `
            mutation {
                ${movieType.operations.update}(delete: { actors: { where: { node: { name_CONTAINS: "Shark" } } } }) {
                    ${movieType.plural} {
                        title
                    }
                    info {
                        nodesDeleted
                    }
                }
            }
        `;

        const expectedMovies = Array.from(Array(101).keys()).map((x) => {
            return { title: `Sharknado ${x}` };
        });
        expectedMovies.push({ title: "Sharknado" });

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: mutation,
            contextValue: neo4j.getContextValues(),
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [movieType.operations.update]: {
                [movieType.plural]: expect.toIncludeSameMembers(expectedMovies),
                info: {
                    nodesDeleted: 101,
                },
            },
        });
    });
});
