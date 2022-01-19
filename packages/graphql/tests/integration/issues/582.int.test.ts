import { graphql } from "graphql";
import { Driver } from "neo4j-driver";
import { Neo4jGraphQL } from "../../../src/classes";
import { generateUniqueType } from "../../utils/graphql-types";
import neo4j from "../neo4j";

describe("582", () => {
    let driver: Driver;
    let type;
    let bookmarks: string[];

    beforeAll(async () => {
        type = generateUniqueType("Entity");
        driver = await neo4j();
        const session = driver.session();

        try {
            await session.run(
                `
                    CREATE (:${type.name} { type: "Cat" })-[:EDGE]->(:${type.name} { type: "Dog" })<-[:EDGE]-(:${type.name} { type: "Bird" })
            `
            );
            bookmarks = session.lastBookmark();
        } finally {
            await session.close();
        }
    });

    afterAll(async () => {
        const session = driver.session();

        try {
            await session.run(
                `
                    MATCH (n: ${type.name}) DETACH DELETE n
            `
            );
        } finally {
            await session.close();
        }

        await driver.close();
    });

    test("should get all Cats where there exists at least one child Dog that has a Bird parent", async () => {
        const session = driver.session();

        const typeDefs = `
            type ${type.name} {
                children: [${type.name}] @relationship(type: "EDGE", properties: "Edge", direction: OUT)
                parents: [${type.name}] @relationship(type: "EDGE", properties: "Edge", direction: IN)
                type: String!
            }

            interface Edge @relationshipProperties {
                type: String!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query ($where: ${type.name}Where) {
                ${type.plural}(where: $where) {
                    type
                }
            }
        `;

        try {
            const gqlResult = await graphql({
                schema: neoSchema.schema,
                source: query,
                variableValues: {
                    where: {
                        type: "Cat",
                        childrenConnection: {
                            node: {
                                type: "Dog",
                                parentsConnection: {
                                    node: {
                                        type: "Bird",
                                    },
                                },
                            },
                        },
                    },
                },
                contextValue: { driver, driverConfig: { bookmarks } },
            });

            expect(gqlResult.errors).toBeFalsy();

            // expect((gqlResult?.data?.updateProducts.products as any[])[0]).toMatchObject({
            //     id: productId,
            //     colorConnection: {
            //         edges: [
            //             {
            //                 test: true,
            //             },
            //         ],
            //     },
            // });
        } finally {
            await session.close();
        }
    });
});
