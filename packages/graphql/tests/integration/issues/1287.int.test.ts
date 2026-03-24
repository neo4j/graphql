/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../utils/graphql-types";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1287", () => {
    const testHelper = new TestHelper();

    let screeningsType: UniqueType;
    let norwegianScreenable: UniqueType;

    let typeDefs: string;

    beforeEach(() => {
        screeningsType = testHelper.createUniqueType("Screening");
        norwegianScreenable = testHelper.createUniqueType("NorwegianScreenableMeta");

        typeDefs = `
            type ${screeningsType} @node {
                id: ID! @id
                title: String
                beginsAt: DateTime!
                movie: [${norwegianScreenable}!]! @relationship(type: "SCREENS_MOVIE", direction: OUT)
            }
    
            interface ScreenableMeta {
                id: ID!
                spokenLanguage: String!
                subtitlesLanguage: String!
                premiere: DateTime!
                locale: LocalTime!
            }
    
            type ${norwegianScreenable} implements ScreenableMeta @node {
                id: ID! @id
                spokenLanguage: String!
                subtitlesLanguage: String!
                premiere: DateTime!
                locale: LocalTime!
                ediNumber: String!
            }
        `;
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test(`should not throw "Cannot read property 'name' of undefined"`, async () => {
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });

        const query = `
            query queryScreenings {
                ${screeningsType.plural}(where: { movieConnection_SINGLE: { node: { id_EQ: "my-id" } } }) {
                    beginsAt
                    movie {
                        id
                    }
                }
            }
        `;

        const res = await testHelper.executeGraphQL(query);

        expect(res.errors).toBeUndefined();
        expect(res.data).toEqual({
            [screeningsType.plural]: [],
        });
    });
});
