import { printSchema, parse, ObjectTypeDefinitionNode, NamedTypeNode, ListTypeNode, NonNullTypeNode } from "graphql";
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

            // FindOne
            const nodeFindOneQuery = queryObject.fields?.find((x) => x.name.value === `FindOne_${type}`);
            const nodeFindOneQueryType = nodeFindOneQuery?.type as NamedTypeNode;
            expect(nodeFindOneQueryType.name.value === type);

            // FindMany
            const nodeFindManyQuery = queryObject.fields?.find((x) => x.name.value === `FindMany_${type}`);
            const nodeFindManyQueryType = ((nodeFindManyQuery?.type as NonNullTypeNode).type as ListTypeNode)
                .type as NamedTypeNode;
            expect(nodeFindManyQueryType.name.value === type);

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
                (x) => x.kind === "EnumTypeDefinition" && x.name.value === `${type}_SORT`
            );
            expect(sort).toBeTruthy();
        });
    });
});
