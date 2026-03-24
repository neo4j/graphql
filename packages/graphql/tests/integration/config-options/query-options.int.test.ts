/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { generate } from "randomstring";
import type { Neo4jGraphQL } from "../../../src";
import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("query options", () => {
    let neoSchema: Neo4jGraphQL;

    const testHelper = new TestHelper();

    let Actor: UniqueType;
    let Movie: UniqueType;

    beforeEach(async () => {
        Actor = testHelper.createUniqueType("Actor");
        Movie = testHelper.createUniqueType("Movie");

        const typeDefs = /* GraphQL */ `
            type ${Actor} @node {
                name: String
                movies: [${Movie}!]! @relationship(type: "ACTED_IN", direction: IN)
            }
    
            type ${Movie} @node {
                id: ID!
                title: String!
                actors: [${Actor}!]! @relationship(type: "ACTED_IN", direction: OUT)
            }
        `;

        neoSchema = await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("queries should work with runtime set to interpreted", async () => {
        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                ${Movie.plural}(where: {id_EQ: $id}){
                    id
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        await testHelper.executeCypher(
            `
              CREATE (:${Movie} {id: $id}), (:${Movie} {id: $id}), (:${Movie} {id: $id})
            `,
            { id }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { id },
            contextValue: { cypherQueryOptions: { runtime: "interpreted" } },
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[Movie.plural]).toEqual([{ id }, { id }, { id }]);
    });

    test("queries should work with version set to Cypher version", async () => {
        const id = generate({
            charset: "alphabetic",
        });

        const query = `
            query($id: ID){
                ${Movie.plural}(where: {id_EQ: $id}){
                    id
                }
            }
        `;

        await neoSchema.checkNeo4jCompat();

        await testHelper.executeCypher(
            `
              CREATE (:${Movie} {id: $id}), (:${Movie} {id: $id}), (:${Movie} {id: $id})
            `,
            { id }
        );

        const result = await testHelper.executeGraphQL(query, {
            variableValues: { id },
            contextValue: { cypherQueryOptions: { runtime: "interpreted", addVersionPrefix: false } },
        });

        expect(result.errors).toBeFalsy();

        expect(result?.data?.[Movie.plural]).toEqual([{ id }, { id }, { id }]);
    });
});
