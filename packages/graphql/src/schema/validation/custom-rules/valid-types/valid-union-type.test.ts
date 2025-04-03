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

describe("Union types validation", () => {
    test("unions cannot be partially nodes", () => {
        const doc = gql`
            union Person = Director | Actor

            type Director {
                name: String
            }

            type Actor @node {
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
        expect(errors[0]).toHaveProperty("message", "Union needs to be fully implemented by `@node` types.");
    });

    test("unions can be either fully implemented by nodes or not", () => {
        const doc = gql`
            union Person = Director | Actor
            union Production = Movie

            type Director @node {
                name: String
            }

            type Actor @node {
                name: String
            }

            type Movie {
                title: String
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

    test("unions cannot be partially nodes with extends", () => {
        const doc = gql`
            union Person = Director | Actor

            type Director {
                name: String
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
        expect(errors).toHaveLength(1);
        expect(errors[0]).not.toBeInstanceOf(NoErrorThrownError);
        expect(errors[0]).toHaveProperty("message", "Union needs to be fully implemented by `@node` types.");
    });
});
