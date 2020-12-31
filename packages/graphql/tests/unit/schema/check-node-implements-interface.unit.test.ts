import { describe, test, expect } from "@jest/globals";
import { InterfaceTypeDefinitionNode, ObjectTypeDefinitionNode, parse, ValueNode } from "graphql";
import checkNodeImplementsInterfaces from "../../../src/schema/check-node-implements-interfaces";

describe("checkNodeImplementsInterfaces", () => {
    test("should throw incorrect with field", () => {
        try {
            const typeDefs = `
                interface Node {
                    id: ID
                }

                type Movie implements Node {
                    title: String!
                }
            `;

            const document = parse(typeDefs);

            const node = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition"
            ) as ObjectTypeDefinitionNode;
            const inter = document.definitions.find(
                (x) => x.kind === "InterfaceTypeDefinition"
            ) as InterfaceTypeDefinitionNode;

            checkNodeImplementsInterfaces(node, [inter]);

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("type Movie does not implement interface Node correctly");
        }
    });

    test("should throw incorrect with auth directive", () => {
        try {
            const typeDefs = `
                interface Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                    id: ID
                }

                type Movie implements Node {
                    id: ID
                    title: String!
                }
            `;

            const document = parse(typeDefs);

            const node = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition"
            ) as ObjectTypeDefinitionNode;
            const inter = document.definitions.find(
                (x) => x.kind === "InterfaceTypeDefinition"
            ) as InterfaceTypeDefinitionNode;

            checkNodeImplementsInterfaces(node, [inter]);

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("type Movie does not implement interface Node correctly");
        }
    });

    test("should throw incorrect with relationship directive", () => {
        try {
            const typeDefs = `
                interface Node {
                    relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                }

                type Movie implements Node {
                    title: String!
                }
            `;

            const document = parse(typeDefs);

            const node = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition"
            ) as ObjectTypeDefinitionNode;
            const inter = document.definitions.find(
                (x) => x.kind === "InterfaceTypeDefinition"
            ) as InterfaceTypeDefinitionNode;

            checkNodeImplementsInterfaces(node, [inter]);

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("type Movie does not implement interface Node correctly");
        }
    });

    test("should throw incorrect with cypher directive", () => {
        try {
            const typeDefs = `
                interface Node {
                    cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
                }

                type Movie implements Node {
                    title: String!
                }
            `;

            const document = parse(typeDefs);

            const node = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition"
            ) as ObjectTypeDefinitionNode;
            const inter = document.definitions.find(
                (x) => x.kind === "InterfaceTypeDefinition"
            ) as InterfaceTypeDefinitionNode;

            checkNodeImplementsInterfaces(node, [inter]);

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("type Movie does not implement interface Node correctly");
        }
    });

    test("should pass on correct implementation", () => {
        const typeDefs = `
                interface Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                    id: ID
                    relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                    cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
                }

                type Movie implements Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                    id: ID
                    title: String!
                    relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                    cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
                }
            `;

        const document = parse(typeDefs);

        const node = document.definitions.find((x) => x.kind === "ObjectTypeDefinition") as ObjectTypeDefinitionNode;
        const inter = document.definitions.find(
            (x) => x.kind === "InterfaceTypeDefinition"
        ) as InterfaceTypeDefinitionNode;

        const result = checkNodeImplementsInterfaces(node, [inter]);

        expect(result).toEqual(undefined);
    });
});
