import type {
    EnumTypeDefinitionNode,
    InterfaceTypeDefinitionNode,
    ObjectTypeDefinitionNode,
    UnionTypeDefinitionNode,
} from "graphql";
import gql from "graphql-tag";
import { getError, NoErrorThrownError } from "../../../../../tests/utils/get-error";
import validateDocument from "../../validate-document";

const additionalDefinitions = {
    enums: [] as EnumTypeDefinitionNode[],
    interfaces: [] as InterfaceTypeDefinitionNode[],
    unions: [] as UnionTypeDefinitionNode[],
    objects: [] as ObjectTypeDefinitionNode[],
};

describe("@relationship validation", () => {
    test("@relationship can't be used with a non-node target", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                name: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty(
            "message",
            'Invalid directive usage: Directive @relationship should be a type with "@node".'
        );
        expect(errors[0]).toHaveProperty("path", ["Movie", "someActors", "@relationship"]);
    });

    test("@relationship can be used with a target that is extended with node", () => {
        const doc = gql`
            type Movie @node {
                someActors: [Actor!]! @relationship(type: "ACTED_IN", direction: OUT)
            }

            type Actor {
                name: String
            }

            extend type Actor @node {
                test: String
            }
        `;

        const executeValidate = () =>
            validateDocument({
                document: doc,
                additionalDefinitions,
                features: {},
            });

        const errors = getError(executeValidate);
        expect(errors).toBeInstanceOf(NoErrorThrownError);
    });
});
