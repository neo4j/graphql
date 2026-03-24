/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/4196", () => {
    const testHelper = new TestHelper();

    let Foo: UniqueType;
    let Bar: UniqueType;
    let FooBar: UniqueType;

    beforeEach(async () => {
        Foo = testHelper.createUniqueType("Foo");
        Bar = testHelper.createUniqueType("Bar");
        FooBar = testHelper.createUniqueType("FooBar");

        const typeDefs = /* GraphQL */ `
            type ${Foo} @node {
                name: String
                bars: [${Bar}!]! @relationship(type: "relatesTo", direction: OUT)
            }
            
            type ${Bar} @node {
                name: String
                foobars: [${FooBar}!]! @relationship(type: "relatesTo", direction: OUT)
            }

            type ${FooBar} @node {
                name: String
                bars: [${FooBar}!]! @relationship(type: "relatesTo", direction: IN)
            }
        `;

        await testHelper.executeCypher(`
            MERGE (:${Foo} {name: "A"})-[:relatesTo]->(b1:${Bar} {name: "bar1"})
            MERGE (:${Foo} {name: "B"})
            MERGE (:${Foo} {name: "C"})-[:relatesTo]->(b3:${Bar} {name: "bar3"})
            MERGE (b1)-[:relatesTo]->(:${FooBar} {name: "a"})
            MERGE (b3)-[:relatesTo]->(:${FooBar} {name: "b"})
        `);

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("querying multiple nested nodes should be sorted correctly", async () => {
        const query = /* GraphQL */ `
            query {
                ${Foo.plural} (sort: { name: ASC }) {
                    name
                    bars {
                        foobars {
                            name
                        }
                    }
                }

            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();
        expect(result.data).toEqual({
            [Foo.plural]: [
                { name: "A", bars: [{ foobars: [{ name: "a" }] }] },
                { name: "B", bars: [] },
                { name: "C", bars: [{ foobars: [{ name: "b" }] }] },
            ],
        });
    });
});
