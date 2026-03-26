/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Type defs are valid", () => {
    let Person: UniqueType;
    let Movie: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        Person = testHelper.createUniqueType("Person");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ActedIn @relationshipProperties {
                roles: [String!]
            }

            type ${Person} @node {
                name: String!
                actedIn: [${Movie}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
                directed: [${Movie}!]! @relationship(type: "DIRECTED", direction: OUT)
            }

            type ${Movie} @node {
                title: String!
                released: Int!
                actors: [${Person}!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
                directors: ${Person} @relationship(type: "DIRECTED", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("simple query", async () => {
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
});
