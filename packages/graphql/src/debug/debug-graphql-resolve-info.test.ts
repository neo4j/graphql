import Debug from "debug";
import { debugGraphQLResolveInfo } from "./debug-graphql-resolve-info";
import { makeExecutableSchema } from "@graphql-tools/schema";
import { graphql } from "graphql";
import type { GraphQLResolveInfo, GraphQLSchema } from "graphql";

describe("debugGraphQLResolveInfo", () => {
    let log: jest.Mock;
    let schema: GraphQLSchema;

    beforeEach(() => {
        log = jest.fn();

        const debug = Debug("test");
        debug.enabled = true;
        // comment out to visually inspect output in console
        debug.log = log;

        const typeDefs = /* GraphQL */ `
            type Query {
                test(
                    arg1: String
                    arg2: Int
                    arg3: Float
                    arg4: Boolean
                    arg5: String
                    arg6: Int
                    arg7: Float
                    arg8: Boolean
                ): String
            }
        `;

        const resolvers = {
            Query: {
                test: (_root, _args, _context, info: GraphQLResolveInfo) => {
                    debugGraphQLResolveInfo(debug, info);
                    return "test";
                },
            },
        };

        schema = makeExecutableSchema({ typeDefs, resolvers });
    });

    test("debugs GraphQL query with no variables", async () => {
        await graphql({
            schema,
            source: /* GraphQL */ `
                {
                    test
                }
            `,
        });

        expect(log.mock.calls[0][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mreceived graphql query"`);
        expect(log.mock.calls[1][0]).toMatchInlineSnapshot(`
            "  [38;5;26;1mtest [0m{
              [38;5;26;1mtest [0m  test
              [38;5;26;1mtest [0m}"
        `);
        expect(log.mock.calls[2][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mvariable values: [32m'variable values:'[39m"`);
    });

    test("debugs GraphQL query with few variable values on a single line", async () => {
        await graphql({
            schema,
            source: /* GraphQL */ `
                query TestQuery($arg1: String, $arg2: Int, $arg3: Float, $arg4: Boolean) {
                    test(arg1: $arg1, arg2: $arg2, arg3: $arg3, arg4: $arg4)
                }
            `,
            variableValues: {
                arg1: "string",
                arg2: 474434,
                arg3: 1.573825789,
                arg4: true,
            },
        });

        expect(log.mock.calls[0][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mreceived graphql query"`);
        expect(log.mock.calls[1][0]).toMatchInlineSnapshot(`
            "  [38;5;26;1mtest [0mquery TestQuery($arg1: String, $arg2: Int, $arg3: Float, $arg4: Boolean) {
              [38;5;26;1mtest [0m  test(arg1: $arg1, arg2: $arg2, arg3: $arg3, arg4: $arg4)
              [38;5;26;1mtest [0m}"
        `);
        expect(log.mock.calls[2][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mvariable values: [32m'variable values:'[39m"`);
    });

    test("debugs GraphQL query with many variable values over multiple lines", async () => {
        await graphql({
            schema,
            source: /* GraphQL */ `
                query TestQuery(
                    $arg1: String
                    $arg2: Int
                    $arg3: Float
                    $arg4: Boolean
                    $arg5: String
                    $arg6: Int
                    $arg7: Float
                    $arg8: Boolean
                ) {
                    test(
                        arg1: $arg1
                        arg2: $arg2
                        arg3: $arg3
                        arg4: $arg4
                        arg5: $arg5
                        arg6: $arg6
                        arg7: $arg7
                        arg8: $arg8
                    )
                }
            `,
            variableValues: {
                arg1: "string",
                arg2: 474434,
                arg3: 1.573825789,
                arg4: true,
                arg5: "string",
                arg6: 474434,
                arg7: 1.573825789,
                arg8: true,
            },
        });

        expect(log.mock.calls[0][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mreceived graphql query"`);
        expect(log.mock.calls[1][0]).toMatchInlineSnapshot(`
            "  [38;5;26;1mtest [0mquery TestQuery($arg1: String, $arg2: Int, $arg3: Float, $arg4: Boolean, $arg5: String, $arg6: Int, $arg7: Float, $arg8: Boolean) {
              [38;5;26;1mtest [0m  test(
              [38;5;26;1mtest [0m    arg1: $arg1
              [38;5;26;1mtest [0m    arg2: $arg2
              [38;5;26;1mtest [0m    arg3: $arg3
              [38;5;26;1mtest [0m    arg4: $arg4
              [38;5;26;1mtest [0m    arg5: $arg5
              [38;5;26;1mtest [0m    arg6: $arg6
              [38;5;26;1mtest [0m    arg7: $arg7
              [38;5;26;1mtest [0m    arg8: $arg8
              [38;5;26;1mtest [0m  )
              [38;5;26;1mtest [0m}"
        `);
        expect(log.mock.calls[2][0]).toMatchInlineSnapshot(`"  [38;5;26;1mtest [0mvariable values: [32m'variable values:'[39m"`);
    });
});
