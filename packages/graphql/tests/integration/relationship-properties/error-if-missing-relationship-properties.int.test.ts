/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 */

import { Neo4jGraphQL } from "../../../src/classes";
import { getErrorAsync } from "../../utils/get-error";

describe("Throw error if missing @relationshipProperties", () => {
    test("should throw error if the @relationshipProperties directive is not used", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node  {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        const errors: Error[] = await getErrorAsync(() => neoSchema.getSchema());
        expect(errors).toHaveLength(2);
        expect(errors[0]).toHaveProperty(
            "message",
            "@relationship.properties invalid. Properties type ActedIn must use directive `@relationshipProperties`."
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "actors", "@relationship", "properties"]);
        expect(errors[1]).toHaveProperty(
            "message",
            "@relationship.properties invalid. Properties type ActedIn must use directive `@relationshipProperties`."
        );
        expect(errors[1]).toHaveProperty("path", ["Actor", "movies", "@relationship", "properties"]);
    });

    test("should not throw error if the @relationshipProperties directive is used", async () => {
        const typeDefs = /* GraphQL */ `
            type Movie @node {
                title: String!
                actors: [Actor!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: IN)
            }

            type Actor @node {
                name: String!
                movies: [Movie!]! @relationship(type: "ACTED_IN", properties: "ActedIn", direction: OUT)
            }

            type ActedIn @relationshipProperties {
                screenTime: Int!
            }
        `;

        const neoSchema = new Neo4jGraphQL({ typeDefs });

        await expect(neoSchema.getSchema()).resolves.not.toThrow();
    });
});
