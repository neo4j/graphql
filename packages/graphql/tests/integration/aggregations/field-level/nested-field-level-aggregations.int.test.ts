/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import type { UniqueType } from "../../../utils/graphql-types";
import { TestHelper } from "../../../utils/tests-helper";

describe("Nested Field Level Aggregations", () => {
    const testHelper = new TestHelper();
    let typeDefs: string;

    let typeMovie: UniqueType;
    let typeActor: UniqueType;

    beforeAll(async () => {
        typeMovie = testHelper.createUniqueType("Movie");
        typeActor = testHelper.createUniqueType("Actor");

        typeDefs = `
        type ${typeMovie.name} @node {
            title: String
            ${typeActor.plural}: [${typeActor.name}!]! @relationship(type: "ACTED_IN", direction: IN, properties:"ActedIn")
        }

        type ${typeActor.name} @node {
            name: String
            age: Int
            born: DateTime
            ${typeMovie.plural}: [${typeMovie.name}!]! @relationship(type: "ACTED_IN", direction: OUT, properties:"ActedIn")
        }

        type ActedIn @relationshipProperties {
            screentime: Int
            character: String
        }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });

        await testHelper.executeCypher(`
        CREATE (m:${typeMovie.name} { title: "Terminator"})<-[:ACTED_IN { screentime: 60, character: "Terminator" }]-(arnold:${typeActor.name} { name: "Arnold", age: 54, born: datetime('1980-07-02')})
        CREATE (m)<-[:ACTED_IN { screentime: 120, character: "Sarah" }]-(:${typeActor.name} {name: "Linda", age:37, born: datetime('2000-02-02')})
        CREATE (:${typeMovie.name} {title: "Total Recall"})<-[:ACTED_IN { screentime: 180, character: "Quaid" }]-(arnold)
        `);
    });

    afterAll(async () => {
        await testHelper.close();
    });

    test("count actors in movies in actors", async () => {
        const query = `
        query Query {
          actors: ${typeActor.plural}(where: {name_EQ: "Arnold"}) {
            name
            movies: ${typeMovie.plural} {
              title
              actorAggregate: ${typeActor.plural}Connection {
                aggregate {
                    count {
                        nodes
                    }
                }
              }
            }
          }
        }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);
        expect(gqlResult.errors).toBeUndefined();
        const movies = (gqlResult.data as any)?.actors[0].movies;
        expect(movies).toHaveLength(2);
        expect(movies).toContainEqual({
            title: "Terminator",
            actorAggregate: { aggregate: { count: { nodes: 2 } } },
        });
        expect(movies).toContainEqual({
            title: "Total Recall",
            actorAggregate: { aggregate: { count: { nodes: 1 } } },
        });
    });
});
