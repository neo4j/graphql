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
import { Neo4jGraphQL } from "../../../src";
import { UniqueType } from "../../utils/graphql-types";
import { cleanNodes } from "../../utils/clean-nodes";

describe("https://github.com/neo4j/graphql/issues/2847", () => {
    let driver: Driver;
    let neo4j: Neo4j;
    let neoSchema: Neo4jGraphQL;
    let session: Session;

    let Movie: UniqueType;
    let Actor: UniqueType;
    let Product: UniqueType;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    beforeEach(async () => {
        session = await neo4j.getSession();

        Movie = new UniqueType("Movie");
        Actor = new UniqueType("Actor");
        Product = new UniqueType("Product");

        const typeDefs = `
          interface ${Product} {
            name: String!
          }
          
          type ${Movie} implements ${Product} {
            name: String!
          }
        
          type ${Actor} {
            name: String!
            product: ${Product} @relationship(type: "HAS_PRODUCT", direction: OUT)
          }
        `;

        await session.run(
            `
            CREATE (c:${Actor})
            SET c.name = $name
        `,
            { name: "Keanu" }
        );

        neoSchema = new Neo4jGraphQL({
            typeDefs,
            driver,
        });
    });

    afterEach(async () => {
        await cleanNodes(session, [Movie, Actor]);
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should returns actors even without any related product", async () => {
        const query = `
            query {
                ${Actor.plural} {
                  name
                  product {
                    name
                  } 
                }
              }
        `;

        const result = await graphql({
            schema: await neoSchema.getSchema(),
            source: query,
            contextValue: neo4j.getContextValues(),
        });
        expect(result.errors).toBeFalsy();
        expect(result.data).toEqual({
            [Actor.plural]: expect.toIncludeSameMembers([
                {
                    name: "Keanu",
                    product: null
                },
            ])
        });
    });
});
