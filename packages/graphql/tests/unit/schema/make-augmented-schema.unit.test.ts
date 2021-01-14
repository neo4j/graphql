import { printSchema, parse, ObjectTypeDefinitionNode, NamedTypeNode, ListTypeNode, NonNullTypeNode } from "graphql";
import { pluralize } from "graphql-compose";
import { describe, test, expect } from "@jest/globals";
import makeAugmentedSchema from "../../../src/schema/make-augmented-schema";
import { Node } from "../../../src/classes";

describe("makeAugmentedSchema", () => {
    test("should be a function", () => {
        expect(makeAugmentedSchema).toBeInstanceOf(Function);
    });

    test("should return the correct schema", () => {
        const typeDefs = `
            type Actor {
                name: String
                movies: [Movie] @relationship(type: "ACTED_IN", direction: "OUT")
            }

            type Movie {
                title: String!
                actors: [Actor] @relationship(type: "ACTED_IN", direction: "IN")
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
            const nodeFindQuery = queryObject.fields?.find((x) => x.name.value === pluralize(type));
            const nodeFindQueryType = ((nodeFindQuery?.type as NonNullTypeNode).type as ListTypeNode)
                .type as NamedTypeNode;
            expect(nodeFindQueryType.name.value === type);

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

            // OR
            const or = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}OR`
            );
            expect(or).toBeTruthy();

            // AND
            const and = document.definitions.find(
                (x) => x.kind === "InputObjectTypeDefinition" && x.name.value === `${type}AND`
            );
            expect(and).toBeTruthy();

            // SORT
            const sort = document.definitions.find(
                (x) => x.kind === "EnumTypeDefinition" && x.name.value === `${type}Sort`
            );
            expect(sort).toBeTruthy();
        });
    });

    test("should throw cannot have interface on relationship", () => {
        try {
            const typeDefs = `
                interface Node {
                    id: ID
                }

                type Movie {
                    title: String!
                    nodes: [Node] @relationship(type: "NODE", direction: "IN")
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("cannot have interface on relationship");
        }
    });

    test("should throw type X does not implement interface X correctly", () => {
        try {
            const typeDefs = `
            interface Node @auth(rules: [{operations: ["read"], allow: "*"}]) {
                id: ID
                relation: [Movie] @relationship(type: "SOME_TYPE", direction: "OUT")
                cypher: [Movie] @cypher(statement: "MATCH (a) RETURN a")
            }

            type Movie implements Node {
                title: String!
            }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("type Movie does not implement interface Node correctly");
        }
    });

    test("should throw relationship union type String must be an object type", () => {
        try {
            const typeDefs = `
                union Test = String | Movie

                type Movie  {
                    title: String!
                    relation: [Test] @relationship(type: "SOME_TYPE", direction: "OUT")
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("relationship union type String must be an object type");
        }
    });

    test("should throw cannot auto-generate a non ID field", () => {
        try {
            const typeDefs = `
                type Movie  {
                    name: String! @autogenerate
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("cannot auto-generate a non ID field");
        }
    });

    test("should throw cannot auto-generate an array", () => {
        try {
            const typeDefs = `
                type Movie  {
                    name: [ID] @autogenerate
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("cannot auto-generate an array");
        }
    });

    test("should throw cannot autogenerate am array of DateTime", () => {
        try {
            const typeDefs = `
                type Movie  {
                    name: [DateTime] @autogenerate
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("cannot auto-generate an array");
        }
    });

    test("should throw autogenerate operations required", () => {
        try {
            const typeDefs = `
                type Movie  {
                    name: DateTime @autogenerate
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("@autogenerated operations required");
        }
    });

    test("should throw autogenerate operations must be an array", () => {
        try {
            const typeDefs = `
                type Movie  {
                    name: DateTime @autogenerate(operations: "read")
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("@autogenerated operations must be an array");
        }
    });

    test("should throw autogenerate operations[0] invalid", () => {
        try {
            const typeDefs = `
                type Movie  {
                    name: DateTime @autogenerate(operations: ["read"])
                }
            `;

            makeAugmentedSchema({ typeDefs });

            throw new Error("something went wrong if i throw");
        } catch (error) {
            expect(error.message).toEqual("@autogenerated operations[0] invalid");
        }
    });
});
