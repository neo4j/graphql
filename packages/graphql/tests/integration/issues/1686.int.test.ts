/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1686", () => {
    let productionType: UniqueType;
    let movieType: UniqueType;
    let genreType: UniqueType;

    const testHelper = new TestHelper();

    beforeAll(async () => {
        productionType = testHelper.createUniqueType("Production");
        movieType = testHelper.createUniqueType("Movie");
        genreType = testHelper.createUniqueType("Genre");

        const typeDefs = `
            interface ${productionType.name} {
                id: ID
                title: String
            }

            type ${movieType.name} implements ${productionType.name} @node {
                id: ID
                title: String
                ${genreType.plural}: [${genreType.name}!]! @relationship(type: "HAS_GENRE", direction: OUT)
            }
            
            type ${genreType.name} @node {
                name: String
                ${movieType.plural}: [${productionType.name}!]! @relationship(type: "HAS_GENRE", direction: IN)
            }
        `;

        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("should be possible to count all the movies connections", async () => {
        const query = `
            query MoviesConnection {
                ${movieType.operations.connection} {
                totalCount
                }
            }
        `;

        const cypher = `
            CREATE (c:${movieType.name} { id: "1", title: "Matrix" })-[:HAS_GENRE]->(:${genreType.name} { id: "10", name: "Sci-fi" })
            CREATE (c)-[:HAS_GENRE]->(g2:${genreType.name} { id: "11", name: "Action" })
            CREATE (h:${movieType.name} { id: "2", title: "The Hobbit" })-[:HAS_GENRE]->(g3:${genreType.name} { id: "12", name: "Fantasy" })
        `;

        await testHelper.executeCypher(cypher);

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toBeUndefined();
        expect(result.data as any).toEqual({
            [movieType.operations.connection]: {
                totalCount: 2,
            },
        });
    });
});
