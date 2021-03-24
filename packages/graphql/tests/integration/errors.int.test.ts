import { graphql, GraphQLError } from "graphql";
import { Neo4jGraphQL } from "../../src/classes";

describe("Errors", () => {
    test("An error should be thrown if no driver is supplied", async () => {
        const typeDefs = `
            type Movie {
              id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const query = `
            query {
                movies {
                    id
                }
            }
        `;

        const gqlResult = await graphql({
            schema: neoSchema.schema,
            source: query,
        });

        expect(gqlResult.errors).toHaveLength(1);
        expect((gqlResult.errors as GraphQLError[])[0].message).toEqual(
            "A Neo4j driver instance must either be passed to Neo4jGraphQL on construction, or passed as context.driver in each request."
        );
    });
});
