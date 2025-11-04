/*
 * Copyright (c) "Neo4j"
 * Neo4j Sweden AB [http://neo4j.com]
 *
 * This file is part of Neo4j.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import { astFromArg, astFromDirective } from "@graphql-tools/utils";
import type { GraphQLArgument } from "graphql";
import { GraphQLDirective, GraphQLError, GraphQLInt } from "graphql";
import { mapError } from "./map-error";
import { VALIDATION_ERROR_CODES } from "./validation-error-codes";

describe("mapError", () => {
    const d = new GraphQLDirective({ name: "MyDir", locations: [], args: { intArg: { type: GraphQLInt } } });
    const a = d.args[0] as GraphQLArgument;
    const directiveNode = astFromDirective(d);
    const argumentNode = astFromArg(a);

    describe("DirectiveArgumentOfCorrectType", () => {
        describe("<type> cannot represent non-<type> value", () => {
            test("Int", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Int cannot represent non-integer value: ""',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: Int cannot represent non-integer value."
                );
            });
            test("Float", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    "Invalid argument: filter, error: Float cannot represent non numeric value: false",
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: Float cannot represent non numeric value."
                );
            });
            test("String", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    "Invalid argument: filter, error: String cannot represent non string value: 2",
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: String cannot represent non string value."
                );
            });
            test("Boolean", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    "Invalid argument: filter, error: Boolean cannot represent non boolean value: 1",
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    "Invalid argument: filter, error: Boolean cannot represent non boolean value."
                );
            });
        });
        test("enum value does not exist in enum", () => {
            const errorOpts = {
                nodes: [argumentNode, directiveNode],
                extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                path: undefined,
                source: undefined,
                positions: undefined,
                originalError: undefined,
            };

            // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
            const error = new GraphQLError(
                'Invalid argument: filter, error: Value "CREATE" does not exist in "AuthorizationValidateOperation" enum.',
                errorOpts.nodes,
                errorOpts.source,
                errorOpts.positions,
                errorOpts.path,
                errorOpts.originalError,
                errorOpts.extensions
            );

            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe('Invalid argument: filter, error: Value "CREATE" does not exist in enum.');
        });

        describe("field is not defined by type", () => {
            test("JWTPayloadWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "JWTPayloadWhere". Did you mean "node"?',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type. Did you mean "node"?'
                );
            });
            test("UserWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "UserWhere".',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type.'
                );
            });
            test("UserAuthorizationFilterRule", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "UserAuthorizationFilterRule".',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type.'
                );
            });
            test("UserAuthorizationWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type "UserAuthorizationWhere". Did you mean "node"?',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );

                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "wrongField" is not defined by type. Did you mean "node"?'
                );
            });
        });

        describe("field of required type was not provided", () => {
            test("JWTPayloadWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "JWTPayloadWhere" was not provided.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
            test("UserWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "UserWhere" was not provided.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
            test("UserAuthorizationFilterRule", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "UserAuthorizationFilterRule" was not provided.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
            test("UserAuthorizationWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Field "nested" of required type "UserAuthorizationWhere" was not provided.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe(
                    'Invalid argument: filter, error: Field "nested" of required type was not provided.'
                );
            });
        });

        describe("expected type to be an object", () => {
            test("JWTPayloadWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "JWTPayloadWhere" to be an object.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
            test("UserWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "UserWhere" to be an object.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
            test("UserAuthorizationFilterRule", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "UserAuthorizationFilterRule" to be an object.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
            test("UserAuthorizationWhere", () => {
                const errorOpts = {
                    nodes: [argumentNode, directiveNode],
                    extensions: { exception: { code: VALIDATION_ERROR_CODES.AUTHORIZATION } },
                    path: undefined,
                    source: undefined,
                    positions: undefined,
                    originalError: undefined,
                };

                // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
                const error = new GraphQLError(
                    'Invalid argument: filter, error: Expected type "UserAuthorizationWhere" to be an object.',
                    errorOpts.nodes,
                    errorOpts.source,
                    errorOpts.positions,
                    errorOpts.path,
                    errorOpts.originalError,
                    errorOpts.extensions
                );
                const mappedError = mapError(error);
                expect(mappedError).toHaveProperty("message");
                expect(mappedError.message).toBe("Invalid argument: filter, error: Expected type to be an object.");
            });
        });
    });

    describe("KnownArgumentNamesOnDirectivesRule", () => {
        test("unknown argument on directive", () => {
            const errorOpts = {
                nodes: [argumentNode],
                extensions: undefined,
                path: undefined,
                source: undefined,
                positions: undefined,
                originalError: undefined,
            };

            // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
            const error = new GraphQLError(
                'Unknown argument "wrongFilter" on directive "@UserAuthorization". Did you mean "filter"?',
                errorOpts.nodes,
                errorOpts.source,
                errorOpts.positions,
                errorOpts.path,
                errorOpts.originalError,
                errorOpts.extensions
            );
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe(
                'Unknown argument "wrongFilter" on directive "@authorization". Did you mean "filter"?'
            );
        });
    });

    describe("UniqueDirectivesPerLocationRule", () => {
        test("directive may not be used on INTERFACE", () => {
            const errorOpts = {
                nodes: [argumentNode],
                extensions: undefined,
                path: undefined,
                source: undefined,
                positions: undefined,
                originalError: undefined,
            };

            // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
            const error = new GraphQLError(
                'Directive "@MemberAuthorization" may not be used on INTERFACE.',
                errorOpts.nodes,
                errorOpts.source,
                errorOpts.positions,
                errorOpts.path,
                errorOpts.originalError,
                errorOpts.extensions
            );
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe('Directive "@authorization" may not be used on INTERFACE.');
        });
        test("directive can only be used once at this location", () => {
            const errorOpts = {
                nodes: [argumentNode],
                extensions: undefined,
                path: undefined,
                source: undefined,
                positions: undefined,
                originalError: undefined,
            };

            // TODO: replace constructor to use errorOpts when dropping support for GraphQL15
            const error = new GraphQLError(
                'The directive "@MemberAuthorization" can only be used once at this location',
                errorOpts.nodes,
                errorOpts.source,
                errorOpts.positions,
                errorOpts.path,
                errorOpts.originalError,
                errorOpts.extensions
            );
            const mappedError = mapError(error);
            expect(mappedError).toHaveProperty("message");
            expect(mappedError.message).toBe('The directive "@authorization" can only be used once at this location');
        });
    });
});
