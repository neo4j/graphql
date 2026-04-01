/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { gql } from "graphql-tag";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/7205", () => {
    const testHelper = new TestHelper();

    let Person: UniqueType;
    let Employer: UniqueType;

    beforeEach(async () => {
        Person = testHelper.createUniqueType("Person");
        Employer = testHelper.createUniqueType("Employer");

        const typeDefs = /* GraphQL */ `
            type ${Person} @node {
                name: String!
                employer: ${Employer} @relationship(type: "WORKS_AT", direction: OUT)
            }

            type ${Employer} @node {
                name: String!
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
            CREATE (m:${Person} {name: "Bob"})
            CREATE (:${Person.name} {name: "Alice"})-[:WORKS_AT]->(:${Employer.name} {name: "Some Inc"})
            `);
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return nodes where there is NO relationship", async () => {
        const query = /*GraphQL*/ `
            {
                ${Person.plural}(where: { employer: null }) {
                    name
                    employer {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data).toEqual({
            [Person.plural]: [
                {
                    name: "Bob",
                    employer: null,
                },
            ],
        });
    });
    test("should return all nodes unfiltered", async () => {
        const query = /*GraphQL*/ `
            {
                ${Person.plural}(where: { NOT: { employer: {} } }) {
                    name
                    employer {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data).toEqual({
            [Person.plural]: expect.toIncludeSameMembers([
                {
                    name: "Bob",
                    employer: null,
                },
                {
                    name: "Alice",
                    employer: {
                        name: "Some Inc",
                    },
                },
            ]),
        });
    });
    test("should return nodes where there is a relationship", async () => {
        const query = /*GraphQL*/ `
            {
                ${Person.plural}(where: { NOT: { employer: null } }) {
                    name
                    employer {
                        name
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);

        expect(result.errors).toBeUndefined();

        expect(result.data).toEqual({
            [Person.plural]: [
                {
                    name: "Alice",
                    employer: {
                        name: "Some Inc",
                    },
                },
            ],
        });
    });
});
