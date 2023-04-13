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

import type { Driver } from "neo4j-driver";
import { graphql } from "graphql";
import { generate } from "randomstring";
import { gql } from "graphql-tag";
import Neo4j from "../neo4j";
import { Neo4jGraphQL } from "../../../src/classes";

describe("https://github.com/neo4j/graphql/issues/235", () => {
    let driver: Driver;
    let neo4j: Neo4j;

    beforeAll(async () => {
        neo4j = new Neo4j();
        driver = await neo4j.getDriver();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("should create the correct number of nodes following multiple connect", async () => {
        const typeDefs = gql`
            type A {
                ID: ID! @id
                name: String!
                rel_b: [B!]! @relationship(type: "REL_B", direction: OUT)
                rel_c: [C!]! @relationship(type: "REL_C", direction: OUT)
            }

            type B {
                ID: ID! @id
                name: String!
            }

            type C {
                ID: ID! @id
                name: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const b1 = generate({ charset: "alphabetic" });
        const b2 = generate({ charset: "alphabetic" });

        const a = generate({ charset: "alphabetic" });

        const c = generate({ charset: "alphabetic" });

        const createBs = `
            mutation CreateBS($b1: String!, $b2: String!) {
                createBs(input: [{ name: $b1 }, { name: $b2 }]) {
                    bs {
                        name
                    }
                }
            }
        `;

        const createAs = `
            mutation CreateAS($a: String!, $b1: String!, $b2: String!, $c: String!) {
                createAs(
                    input: [
                        {
                            name: $a
                            rel_b: { connect: { where: { node: { name_IN: [$b1, $b2] } } } }
                            rel_c: { create: { node: { name: $c } } }
                        }
                    ]
                ) {
                    as {
                        name
                        rel_b {
                            name
                        }
                        rel_c {
                            name
                        }
                    }
                }
            }
        `;

        const as = `
            query As($a: String) {
                as(where: { name: $a }) {
                    name
                    rel_b {
                        name
                    }
                    rel_c {
                        name
                        ID
                    }
                }
            }
        `;

        const createBsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createBs,
            variableValues: { b1, b2 },
            contextValue: neo4j.getContextValues(),
        });

        expect(createBsResult.errors).toBeFalsy();
        expect((createBsResult.data as any)?.createBs.bs).toEqual([{ name: b1 }, { name: b2 }]);

        const createAsResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: createAs,
            variableValues: { a, b1, b2, c },
            contextValue: neo4j.getContextValues(),
        });

        expect(createAsResult.errors).toBeFalsy();
        expect((createAsResult.data as any)?.createAs.as).toHaveLength(1);
        expect((createAsResult.data as any)?.createAs.as[0].name).toEqual(a);
        expect((createAsResult.data as any)?.createAs.as[0].rel_b).toHaveLength(2);
        expect((createAsResult.data as any)?.createAs.as[0].rel_b).toContainEqual({ name: b1 });
        expect((createAsResult.data as any)?.createAs.as[0].rel_b).toContainEqual({ name: b2 });
        expect((createAsResult.data as any)?.createAs.as[0].rel_c).toEqual([{ name: c }]);

        const asResult = await graphql({
            schema: await neoSchema.getSchema(),
            source: as,
            variableValues: { a },
            contextValue: neo4j.getContextValues(),
        });

        expect(asResult.errors).toBeFalsy();
        expect((asResult.data as any)?.as).toHaveLength(1);
        expect((asResult.data as any)?.as[0].name).toEqual(a);
        expect((asResult.data as any)?.as[0].rel_b).toHaveLength(2);
        expect((asResult.data as any)?.as[0].rel_b).toContainEqual({ name: b1 });
        expect((asResult.data as any)?.as[0].rel_b).toContainEqual({ name: b2 });
        expect((asResult.data as any)?.as[0].rel_c).toHaveLength(1);
        expect((asResult.data as any)?.as[0].rel_c[0].name).toEqual(c);
    });
});
