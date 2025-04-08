import type { UniqueType } from "../../../../utils/graphql-types";
import { TestHelper } from "../../../../utils/tests-helper";

describe("aggregations-where-edge-string interface relationships of interface types", () => {
    let testHelper: TestHelper;

    let Movie: UniqueType;
    let Series: UniqueType;
    let Production: UniqueType;
    let Actor: UniqueType;
    let Cameo: UniqueType;
    let Person: UniqueType;

    beforeEach(async () => {
        testHelper = new TestHelper();

        Movie = testHelper.createUniqueType("Movie");
        Series = testHelper.createUniqueType("Series");
        Production = testHelper.createUniqueType("Production");
        Actor = testHelper.createUniqueType("Actor");
        Cameo = testHelper.createUniqueType("Cameo");
        Person = testHelper.createUniqueType("Person");

        const typeDefs = /* GraphQL */ `
            interface ${Production} {
                title: String
            }

            type ${Movie} implements ${Production} @node {
                title: String
            }

            type ${Series} implements ${Production} @node {
                title: String
            }

            interface ${Person} {
                name: String
                productions: [${Production}!]! @declareRelationship
            }

            type ${Actor} implements ${Person} @node {
                name: String
                productions: [${Production}!]! @relationship(type: "ACTED_IN", direction: OUT, properties: "ActedIn")
            }

            type ${Cameo} implements ${Person} @node {
                name: String
                productions: [${Production}!]! @relationship(type: "APPEARED_IN", direction: OUT, properties: "AppearedIn")
            }

            type ActedIn @relationshipProperties {
                role: String
            }

            type AppearedIn @relationshipProperties {
                role: String
            }
        `;

        await testHelper.initNeo4jGraphQL({ typeDefs });
    });

    afterEach(async () => {
        await testHelper.close();
    });

    test("should return nodes aggregated across different relationship properties types", async () => {
        await testHelper.executeCypher(
            `
                CREATE (a:${Actor} { name: "A" })-[:ACTED_IN { role: "definitely too long" }]->(g:${Movie} { title: "G" })
                CREATE (a)-[:ACTED_IN { role: "extremely long" }]->(g)
                CREATE (b:${Actor} { name: "B" })-[:ACTED_IN { role: "a" }]->(h:${Series} { title: "H" })
                CREATE (b)-[:ACTED_IN { role: "b" }]->(h)
                CREATE (c:${Actor} { name: "C" })
                CREATE (d:${Cameo} { name: "D" })-[:APPEARED_IN { role: "too long" }]->(i:${Movie} { title: "I" })
                CREATE (d)-[:APPEARED_IN { role: "also too long" }]->(i)
                CREATE (e:${Cameo} { name: "E" })-[:APPEARED_IN { role: "s" }]->(j:${Series} { title: "J" })
                CREATE (e)-[:APPEARED_IN { role: "very long" }]->(j)
                CREATE (f:${Cameo} { name: "F" })
            `
        );

        const query = /* GraphQL */ `
            query People {
                ${Person.plural}(
                    where: {
                        productionsConnection: {
                            aggregate: {
                                edge: {
                                    AppearedIn: { role_SHORTEST_LENGTH_LT: 3 }
                                    ActedIn: { role_AVERAGE_LENGTH_LT: 5 }
                                }
                            }
                        }
                    }
                ) {
                    name
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Person.plural]).toIncludeSameMembers([{ name: "E" }, { name: "B" }]);
    });

    test("should return nodes aggregated across relationship properties and count", async () => {
        await testHelper.executeCypher(
            `
            CREATE (a:${Actor} { name: "A" })
            CREATE (b:${Actor} { name: "B" })
            CREATE (b2:${Actor} { name: "B2" })
            CREATE (c:${Actor} { name: "C" })

            CREATE (d:${Cameo} { name: "D" })
            CREATE (e:${Cameo} { name: "E" })
            CREATE (f:${Cameo} { name: "F" })
            
            CREATE (g:${Movie} { title: "G" })
            CREATE (i:${Movie} { title: "I" })
            
            CREATE (h:${Series} { title: "H" })
            CREATE (h2:${Series} { title: "H2" })
            CREATE (j:${Series} { title: "J" })

            CREATE (a)-[:ACTED_IN { role: "definitely too long" }]->(g)
            CREATE (a)-[:ACTED_IN { role: "extremely long" }]->(g)
            CREATE (b)-[:ACTED_IN { role: "a" }]->(h)
            CREATE (b)-[:ACTED_IN { role: "b" }]->(h)
            CREATE (b2)-[:ACTED_IN { role: "a" }]->(h)
            CREATE (b2)-[:ACTED_IN { role: "b" }]->(h2)
            CREATE (b2)-[:ACTED_IN { role: "b" }]->(j)
            CREATE (d)-[:APPEARED_IN { role: "too long" }]->(i)
            CREATE (d)-[:APPEARED_IN { role: "also too long" }]->(i)
            CREATE (e)-[:APPEARED_IN { role: "s" }]->(j)
            CREATE (e)-[:APPEARED_IN { role: "very long" }]->(h)
            CREATE (e)-[:APPEARED_IN { role: "another very long" }]->(h2)
            `
        );

        const query = /* GraphQL */ `
            query People {
                ${Person.plural}(
                    where: { 
                        productionsConnection: { 
                            aggregate: { 
                                edge: { ActedIn: { role_AVERAGE_LENGTH_LT: 5 } }, 
                                count: { nodes: { lt: 3 } } 
                            }
                        } 
                    }
                ) {
                    name
                }
            }
        `;

        const gqlResult = await testHelper.executeGraphQL(query);

        if (gqlResult.errors) {
            console.log(JSON.stringify(gqlResult.errors, null, 2));
        }

        expect(gqlResult.errors).toBeUndefined();

        expect((gqlResult.data as any)[Person.plural]).toIncludeSameMembers([
            { name: "D" },
            { name: "B" },
            { name: "F" },
        ]);
    });
});
