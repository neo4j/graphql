/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DirectiveNode, ObjectTypeDefinitionNode, parse } from "graphql";
import getAuth from "../../../src/schema/get-auth";

describe("getAuth", () => {
    test("should throw rules required", () => {
        const typeDefs = `
            type Movie @auth {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules required");
    });

    test("should throw rules must be a ListValue", () => {
        const typeDefs = `
            type Movie @auth(rules: true) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0];

        expect(() => getAuth(directive)).toThrow("auth rules must be a ListValue");
    });

    test("should return AuthRule", () => {
        const typeDefs = `
            type Person {
                id: ID
                name: String
            }

            type Movie @auth(rules: [
                { isAuthenticated: true, operations: ["create"] },
                { roles: ["admin", "publisher"], operations: ["update", "delete"] },
                { roles: ["editors"], operations: ["update"] },
                {
                    allow: { author_id: "$jwt.sub", moderator_id: "$jwt.sub" },
                    operations: ["update", "delete"]
                },
                { allow: "*", operations: ["update"] },
                { allow: {OR: [{director_id: "$jwt.sub"}, {actor_id: "$jwt.sub"}]}, operations: ["update"] },
            ]) {
                id: ID
                title: String
                director: Person @relationship(type: "DIRECTOR_OF", direction: "IN")
                actor: Person @relationship(type: "ACTED_IN", direction: "IN")
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions.find((x) => x.name.value === "Movie") as ObjectTypeDefinitionNode)
            .directives[0];

        const auth = getAuth(directive);

        expect(auth).toMatchObject({
            rules: [
                { isAuthenticated: true, operations: ["create"] },
                { roles: ["admin", "publisher"], operations: ["update", "delete"] },
                { roles: ["editors"], operations: ["update"] },
                { allow: { author_id: "$jwt.sub", moderator_id: "$jwt.sub" }, operations: ["update", "delete"] },
                { allow: "*", operations: ["update"] },
                { allow: { OR: [{ director_id: "$jwt.sub" }, { actor_id: "$jwt.sub" }] }, operations: ["update"] },
            ],
            type: "JWT",
        });
    });
});
