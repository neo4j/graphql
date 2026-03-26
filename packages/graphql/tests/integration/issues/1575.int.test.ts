/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { GraphQLError } from "graphql";
import { TestHelper } from "../../utils/tests-helper";

describe("https://github.com/neo4j/graphql/issues/1575", () => {
    const testHelper = new TestHelper();

    beforeEach(async () => {
        const typeDefs = /* GraphQL */ `
            type Foo @node {
                point: Point
                geo_point: Point @alias(property: "point")
            }
        `;
        await testHelper.initNeo4jGraphQL({
            typeDefs,
        });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("fails mutateing fields with same name in alias", async () => {
        const query = /* GraphQL */ `
            mutation MyMutation {
                updateFoos(
                    update: { geo_point_SET: { longitude: 1, latitude: 1.5 }, point_SET: { longitude: 2, latitude: 1.5 } }
                ) {
                    foos {
                        point {
                            longitude
                            latitude
                        }
                    }
                }
            }
        `;

        const result = await testHelper.executeGraphQL(query);
        expect(result.errors).toEqual([
            new GraphQLError("Conflicting modification of [[point_SET]], [[geo_point_SET]] on type Foo"),
        ]);
    });
});
