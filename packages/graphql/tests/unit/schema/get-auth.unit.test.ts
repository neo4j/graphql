/* eslint-disable @typescript-eslint/ban-ts-comment */
import { DirectiveNode, ObjectTypeDefinitionNode, parse } from "graphql";
import { Auth } from "../../../src/classes";
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
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("auth rules required");
        }
    });

    test("should throw rules must be a ListValue", () => {
        const typeDefs = `
            type Movie @auth(rules: true) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("auth rules must be a ListValue");
        }
    });

    test("should throw rules[0] must be a ObjectValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [true]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0] must be a ObjectValue");
        }
    });

    test("should throw rules[0].operations required", () => {
        const typeDefs = `
            type Movie @auth(rules: [{abc: true}]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].operations required");
        }
    });

    test("should throw rules[0].operations must be a ListValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [{operations: true}]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].operations must be a ListValue");
        }
    });

    test("should throw rules[0].operations cant be empty", () => {
        const typeDefs = `
            type Movie @auth(rules: [{operations: []}]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].operations cant be empty");
        }
    });

    test("should throw rules[0].operations[0] invalid", () => {
        const typeDefs = `
            type Movie @auth(rules: [{operations: ["invalid"]}]) {
                id: ID!
            }
         `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].operations[0] invalid");
        }
    });

    test("should throw rules[0].isAuthenticated must be a boolean", () => {
        const typeDefs = `
            type Movie @auth(rules: [{isAuthenticated: "true", operations: ["read"]}]) {
                id: ID!
            }
         `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].isAuthenticated must be a boolean");
        }
    });

    test("should throw invalid rules[0].allow StringValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [
                {
                    allow: "true",
                    operations: ["read"]
                }
            ]) {
                id: ID!
            }
         `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].allow invalid StringValue");
        }
    });

    test("should throw rules[0].allow must be a ObjectValue or StringValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [
                {
                    allow: true,
                    operations: ["read"]
                }
            ]) {
                id: ID!
            }
         `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].allow must be a ObjectValue or StringValue");
        }
    });

    test("should throw rules[0].allow[abc] must be a string", () => {
        const typeDefs = `
            type Movie @auth(rules: [
                { 
                    allow: { abc: true },
                    operations: ["read"]
                }
            ]) {
                id: ID!
            }
         `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].allow[abc] must be a string");
        }
    });

    test("should throw rules[0].roles must be a ListValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [
                { 
                    roles: true,
                    operations: ["read"]
                }
            ]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].roles must be a ListValue");
        }
    });

    test("should throw rules[0].roles[0] must be a StringValue", () => {
        const typeDefs = `
            type Movie @auth(rules: [
                {
                    roles: [true],
                    operations: ["read"]
                }
            ]) {
                id: ID!
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        try {
            getAuth(directive);

            throw new Error();
        } catch (error) {
            expect(error.message).toEqual("rules[0].roles[0] must be a StringValue");
        }
    });

    test("should return AuthRule", () => {
        const typeDefs = `
            type Movie @auth(rules: [
                { isAuthenticated: true, operations: ["create"] },
                { roles: ["admin", "publisher"], operations: ["update", "delete"] },
                { roles: ["editors"], operations: ["update"] },
                { 
                    allow: { author_id: "sub", moderator_id: "sub" }, 
                    operations: ["update", "delete"] 
                },
                { allow: "*", operations: ["update"] },
            ]) {
                id: ID
                title: String
            }
        `;

        const parsed = parse(typeDefs);

        // @ts-ignore
        const directive = (parsed.definitions[0] as ObjectTypeDefinitionNode).directives[0] as DirectiveNode;

        const auth = getAuth(directive);

        expect(auth).toBeInstanceOf(Auth);

        expect(auth).toMatchObject({
            rules: [
                { isAuthenticated: true, operations: ["create"] },
                { roles: ["admin", "publisher"], operations: ["update", "delete"] },
                { roles: ["editors"], operations: ["update"] },
                { allow: { author_id: "sub", moderator_id: "sub" }, operations: ["update", "delete"] },
                { allow: "*", operations: ["update"] },
            ],
            type: "JWT",
        });
    });
});
