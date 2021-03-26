import camelCase from "camelcase";
import { printSchema, parse, ObjectTypeDefinitionNode, NamedTypeNode, ListTypeNode, NonNullTypeNode } from "graphql";
import { pluralize } from "graphql-compose";
import makeAugmentedSchema from "./make-augmented-schema";
import { Node } from "../classes";

describe("makeAugmentedSchema", () => {
    test("should be a function", () => {
        expect(makeAugmentedSchema).toBeInstanceOf(Function);
    });

    test("should return the correct schema", () => {
        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Movie {
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: IN)
            }
        `;

        const neoSchema = makeAugmentedSchema({ typeDefs });
        const document = parse(printSchema(neoSchema.schema));
        const queryObject = document.definitions.find(
            (x) => x.kind === "ObjectTypeDefinition" && x.name.value === "Query"
        ) as ObjectTypeDefinitionNode;

        ["Actor", "Movie"].forEach((type) => {
            const node = neoSchema.nodes.find((x) => x.name === type);
            expect(node).toBeInstanceOf(Node);
            const nodeObject = document.definitions.find(
                (x) => x.kind === "ObjectTypeDefinition" && x.name.value === type
            );
            expect(nodeObject).toBeTruthy();

            // Find
            const nodeFindQuery = queryObject.fields?.find((x) => x.name.value === pluralize(camelCase(type)));
            const nodeFindQueryType = ((nodeFindQuery?.type as NonNullTypeNode).type as ListTypeNode)
                .type as NamedTypeNode;
            expect(nodeFindQueryType.name.value).toEqual(type);

            // Options
            const options = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Options`
            );
            expect(options).toBeTruthy();

            // Where
            const where = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Where`
            );
            expect(where).toBeTruthy();

            // SORT
            const sort = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}Sort`
            );
            expect(sort).toBeTruthy();
        });
    });

    test("should throw cannot have interface on relationship", () => {
        const typeDefs = `
                interface Node {
                    id: ID
                }

                type Movie {
                    title: String!
                    nodes: [Node] @relationship(type: "NODE", direction: IN)
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot have interface on relationship");
    });

    test("should throw type X does not implement interface X correctly", () => {
        const typeDefs = `
            interface Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                id: ID
                relation: [Movie] @relationship(type: "SOME_TYPE", direction: OUT)
                cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
            }

            type Movie implements Node {
                title: String!
            }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow(
            "type Movie does not implement interface Node correctly"
        );
    });

    test("should throw cannot auto-generate a non ID field", () => {
        const typeDefs = `
            type Movie  {
                name: String! @autogenerate
            }
        `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot auto-generate a non ID field");
    });

    test("should throw cannot auto-generate an array", () => {
        const typeDefs = `
                type Movie  {
                    name: [ID] @autogenerate
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot auto-generate an array");
    });

    test("should throw cannot autogenerate am array of DateTime", () => {
        const typeDefs = `
                type Movie  {
                    name: [DateTime] @autogenerate
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot auto-generate an array");
    });

    test("should throw autogenerate operations required", () => {
        const typeDefs = `
                type Movie  {
                    name: DateTime @autogenerate
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("@autogenerate operations required");
    });

    test("should throw autogenerate operations must be an array", () => {
        const typeDefs = `
                type Movie  {
                    name: DateTime @autogenerate(operations: "read")
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("@autogenerate operations must be an array");
    });

    test("should throw autogenerate operations[0] invalid", () => {
        const typeDefs = `
                type Movie  {
                    name: DateTime @autogenerate(operations: ["read"])
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("@autogenerate operations[0] invalid");
    });

    test("should throw cannot have auth directive on a relationship", () => {
        const typeDefs = `
                type Node {
                    node: Node @relationship(type: "NODE", direction: OUT) @auth(rules: [{operations: ["create"], roles: ["admin"]}])
                }
            `;

        expect(() => makeAugmentedSchema({ typeDefs })).toThrow("cannot have auth directive on a relationship");
    });
});
