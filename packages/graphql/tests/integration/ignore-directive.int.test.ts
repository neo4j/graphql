import { Driver, Session } from "neo4j-driver";
import faker from "faker";
import { gql } from "apollo-server";
import { createTestClient } from "apollo-server-testing";
import neo4j from "./neo4j";
import { constructTestServer } from "./utils";
import { Neo4jGraphQL } from "../../src/classes";

describe("@ignore directive", () => {
    let driver: Driver;
    let session: Session;
    let server;

    beforeAll(async () => {
        driver = await neo4j();
        const typeDefs = `
            type User {
                username: String!
                customField: String! @ignore
            }
        `;
        const resolvers = { User: { customField: () => "Some custom value" } };
        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers });
        server = constructTestServer(neoSchema, driver);
    });

    beforeEach(() => {
        session = driver.session();
    });

    afterEach(async () => {
        await session.close();
    });

    afterAll(async () => {
        await driver.close();
    });

    test("removes a field from all but its object type, and resolves with a custom resolver", async () => {
        const username = faker.internet.userName();

        await session.run(`
            CALL {
                CREATE (u:User)
                SET u.username = "${username}"
                RETURN u
            }

            RETURN u
        `);

        const usersQuery = gql`
            query Users($username: String!) {
                users(where: { username: $username }) {
                    username
                    customField
                }
            }
        `;

        const { query } = createTestClient(server);

        const gqlResult = await query({ query: usersQuery, variables: { username } });

        expect(gqlResult.errors).toBeFalsy();
        expect(gqlResult.data.users[0]).toEqual({
            username,
            customField: "Some custom value",
        });
    });
});
