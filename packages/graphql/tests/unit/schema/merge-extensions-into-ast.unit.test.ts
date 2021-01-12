import { parse, print } from "graphql";
import { describe, test, expect } from "@jest/globals";
import mergeExtensionsIntoAST from "../../../src/schema/merge-extensions-into-ast";

describe("mergeExtensionsIntoAST", () => {
    test("should merge OBJECT_TYPE_DEFINITION", () => {
        const typeDefs = `
            type Query {
                name: String
            }


            extend type Query @test {
                age: Int
            }
        `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
                type Query @test {
                    name: String
                    age: Int
                }
            `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });

    test("should merge SCALAR_TYPE_DEFINITION", () => {
        const typeDefs = `
            scalar Test

            extend scalar Test @test
        `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
                scalar Test @test
            `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });

    test("should merge INTERFACE_TYPE_DEFINITION", () => {
        const typeDefs = `
            interface Node1 {
                id: ID
            }

            extend interface Node1 @test

            extend interface Node1 {
                name: String
            }
        `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
                interface Node1 @test {
                    id: ID
                    name: String
                }
            `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });

    test("should merge UNION_TYPE_DEFINITION", () => {
        const typeDefs = `
           union Test = String | Number

           extend union Test @test

           extend union Test = Float
        `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
                union Test @test = String | Number | Float
            `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });

    test("should merge ENUM_TYPE_DEFINITION", () => {
        const typeDefs = `
            enum Test {
                abc
            }
          
            extend enum Test @test {
                bca
            }
        `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
                enum Test @test {
                    abc 
                    bca
                }
            `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });

    test("should merge INPUT_OBJECT_TYPE_DEFINITION", () => {
        const typeDefs = `
            input Test {
                abc: String
            }
          
            extend input Test @test {
                bca: String
            }
        `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
                input Test @test {
                    abc: String 
                    bca: String
                }
            `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });

    test("should extend a field with a new directive", () => {
        const typeDefs = `
        type User {
            password: String
        }
      
        extend type User {
            password: String @readonly
        }
    `;

        const document = parse(typeDefs);

        const mergedDocument = mergeExtensionsIntoAST(document);

        const expected = print(
            parse(`
            type User {
                password: String @readonly
            }
        `)
        );

        expect(print(mergedDocument)).toEqual(expected);
    });
});
