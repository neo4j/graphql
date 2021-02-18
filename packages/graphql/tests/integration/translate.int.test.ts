import { graphql } from "graphql";
import { describe, test, expect } from "@jest/globals";
import { Neo4jGraphQL } from "../../src/classes";
import translate from "../../src/translate/translate";
import { trimmer } from "../../src/utils";

describe("translate", () => {
    test("should use a custom resolver to translate the cypher", async () => {
        const typeDefs = `
            type Movie {
                id: ID
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs, resolvers: { Query: { movies: MoviesResolver } } });

        function MoviesResolver(_root, _args, context, resolveInfo) {
            context.neoSchema = neoSchema;

            const [cypher] = translate({ context, resolveInfo });

            if (
                trimmer(cypher) ===
                trimmer(`
                    MATCH (this:Movie)
                    RETURN this { .id } as this
                `)
            ) {
                throw new Error("cypher correct");
            } else {
                throw new Error("cypher incorrect");
            }
        }

        const query = `
            query {
                movies {
                    id
                }
            }
        `;

        const result = await graphql({
            schema: neoSchema.schema,
            source: query,
            contextValue: { driver: {} },
        });

        expect((result.errors as any[])[0].message).toEqual("cypher correct");
    });
});
